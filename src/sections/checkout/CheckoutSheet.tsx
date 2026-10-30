import { router, Stack, useFocusEffect, usePreventRemove } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { BackHandler, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { announce, focusOn } from "@/lib/a11y";
import {
  buildOrder,
  LIMITS,
  orderMessage,
  orderTotals,
  paymentFee,
  paymentMethods,
  sameCharges,
  validateCustomer,
  type Customer,
  type FieldErrors,
  type PaymentMethod,
} from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { placeOrder, type OrderError } from "@/lib/orders";
import { whatsappUrl } from "@/lib/whatsapp";
import { Totals } from "@/sections/bag/Totals";
import { useCart } from "@/stores/cart";
import { ensureFreshCatalogue, useCatalogue } from "@/stores/catalogue";
import { requestIdFor, resetRequestId, useCheckout } from "@/stores/checkout";
import { palette } from "@/theme/palette";
import { DoneStep } from "./DoneStep";
import { Field } from "./Field";
import { PaymentOption } from "./PaymentOption";
import { PayStep } from "./PayStep";

const copy = brand.copy.checkout;
const cartCopy = brand.copy.cart;

type Step = "details" | "pay" | "done";
type Problem = OrderError | "prices";
type Placed = { id: string; payment: PaymentMethod };

const FIELDS: (keyof Customer)[] = ["name", "phone", "city", "address", "notes"];

/** What each failure tells the customer; null = the generic error. */
const MESSAGES: Partial<Record<Problem, string>> = {
  offline: copy.offline,
  "sold-out": copy.soldOut,
  "too-many": copy.tooMany,
  prices: copy.pricesChanged,
  "price-changed": copy.pricesChanged,
};

/** Failures that offer the WhatsApp fallback (the order is never lost). */
const WHATSAPP: Problem[] = ["offline", "too-many", "invalid", "unauthorized", "failed"];

/**
 * Checkout, identical to the website's CheckoutDialog: delivery details and a payment choice
 * (EasyPaisa / JazzCash with a screenshot, or cash on delivery), then the confirmation. Orders go
 * straight to the orders script. The sheet can't be dismissed while an order is sending.
 */
export function CheckoutSheet() {
  const insets = useSafeAreaInsets();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const catalogue = useCatalogue((state) => state.catalogue);
  const customer = useCheckout((state) => state.customer);
  const setField = useCheckout((state) => state.setField);
  const choice = useCheckout((state) => state.choice);
  const setChoice = useCheckout((state) => state.setChoice);
  const screenshot = useCheckout((state) => state.screenshot);
  const sending = useCheckout((state) => state.sending);
  const setSending = useCheckout((state) => state.setSending);
  const placedReset = useCheckout((state) => state.placed);

  const [step, setStep] = useState<Step>("details");
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const inputs = useRef<Partial<Record<keyof Customer, ComponentRef<typeof TextInput> | null>>>({});

  const order = useMemo(() => buildOrder(items, catalogue), [items, catalogue]);
  // Paying into the wallet needs a known amount.
  const walletAvailable = !order.hasPriceOnRequest;
  const payment: PaymentMethod = walletAvailable ? choice : "cod";
  const totals = orderTotals(order, payment, catalogue);
  const soldOut = order.lines.some((line) => !line.inStock);
  const busy = sending || checking;

  // A fresh catalogue whenever checkout opens.
  useEffect(() => {
    void ensureFreshCatalogue();
  }, []);

  // An order in flight can't be dismissed (swipe, back button or close).
  usePreventRemove(sending, () => undefined);

  const show = useCallback((next: Step) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
    focusOn(heading);
  }, []);

  const close = useCallback(() => {
    if (useCheckout.getState().sending) return;
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, []);

  // Android back: from the payment step back to the details; never while sending.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (useCheckout.getState().sending) return true;
        if (step === "pay") {
          show("details");
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [step, show]),
  );

  const fail = (next: Problem) => {
    setProblem(next);
    haptics.warning();
    announce(MESSAGES[next] ?? copy.error);
  };

  const submit = async () => {
    if (useCheckout.getState().sending) return;
    setProblem(null);
    setSending(true);
    const shot = payment === "wallet" && screenshot ? { name: screenshot.name, type: screenshot.type, data: screenshot.data } : null;
    // The same order keeps the same requestId, so a retry can't create a second order.
    const fingerprint = JSON.stringify({
      items,
      customer,
      payment,
      shot: shot ? `${shot.name}:${shot.data.length}:${shot.data.slice(-64)}` : null,
    });
    const result = await placeOrder({
      items,
      customer,
      payment,
      screenshot: shot,
      expectedTotal: totals.total,
      requestId: requestIdFor(fingerprint),
    });
    setSending(false);

    if (result.ok) {
      haptics.success();
      announce(`${brand.copy.checkout.done.title}. ${brand.copy.checkout.done.order} ${result.id}`);
      resetRequestId();
      setPlaced({ id: result.id, payment });
      clear();
      placedReset();
      show("done");
      return;
    }

    if (result.catalogue) useCatalogue.getState().set(result.catalogue);
    if (result.error === "price-changed") {
      show("details");
      fail("prices");
      return;
    }
    fail(result.error);
  };

  const onDetails = async () => {
    const found = validateCustomer(customer);
    setErrors(found);
    const first = FIELDS.find((field) => found[field]);
    if (first) {
      haptics.warning();
      inputs.current[first]?.focus();
      announce(found[first] ?? "");
      return;
    }
    if (soldOut) return fail("sold-out");

    // Make sure the amount is current before asking for money.
    setProblem(null);
    setChecking(true);
    const fresh = await ensureFreshCatalogue();
    setChecking(false);
    const nextOrder = buildOrder(items, fresh);
    const nextPayment: PaymentMethod = nextOrder.hasPriceOnRequest ? "cod" : choice;
    if (!sameCharges(order, nextOrder, totals, orderTotals(nextOrder, nextPayment, fresh))) return fail("prices");
    if (nextOrder.lines.some((line) => !line.inStock)) return fail("sold-out");

    if (nextPayment === "wallet") show("pay");
    else void submit();
  };

  const onPay = () => {
    if (!screenshot) {
      setUploadError(copy.screenshot.required);
      haptics.warning();
      announce(copy.screenshot.required);
      return;
    }
    void submit();
  };

  const fallback = problem && WHATSAPP.includes(problem) ? whatsappUrl(orderMessage(order, payment, customer, catalogue)) : null;
  const label = sending ? copy.placing : step === "pay" || payment === "cod" ? copy.placeOrder : copy.continue;

  const field = (name: keyof Customer, next?: keyof Customer) => ({
    ref: (input: ComponentRef<typeof TextInput> | null) => {
      inputs.current[name] = input;
    },
    value: customer[name],
    onChangeText: (value: string) => {
      setField(name, value);
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    },
    error: errors[name],
    editable: !busy,
    returnKeyType: next ? ("next" as const) : ("done" as const),
    submitBehavior: next ? ("submit" as const) : ("blurAndSubmit" as const),
    onSubmitEditing: () => (next ? inputs.current[next]?.focus() : undefined),
  });

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ gestureEnabled: !sending }} />
      <View style={[styles.header, { paddingTop: Platform.OS === "android" ? insets.top + 8 : 16 }]}>
        <Text variant="label" tone="gold200">
          {copy.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.close}
          accessibilityState={{ disabled: sending }}
          disabled={sending}
          onPress={close}
          style={[styles.close, sending && styles.dim]}
          hitSlop={8}
        >
          <Icon name="close" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "android" ? "padding" : undefined}>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {step === "details" ? (
            <View style={styles.step}>
              <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={copy.details}>
                <Text variant="h3">{copy.details}</Text>
              </View>
              <Field label={copy.name} textContentType="name" autoComplete="name" autoCapitalize="words" maxLength={LIMITS.name} {...field("name", "phone")} />
              <Field
                label={copy.phone}
                hint={copy.phoneHint}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={20}
                {...field("phone", "city")}
              />
              <Field label={copy.city} textContentType="addressCity" autoComplete="postal-address-locality" autoCapitalize="words" maxLength={LIMITS.city} {...field("city", "address")} />
              <Field
                label={copy.address}
                textContentType="fullStreetAddress"
                autoComplete="street-address"
                multiline
                maxLength={LIMITS.address}
                {...field("address", "notes")}
              />
              <Field label={copy.notes} multiline maxLength={LIMITS.notes} {...field("notes")} />

              <Text variant="micro" tone="ivoryMuted" style={styles.groupLabel} accessibilityRole="header">
                {copy.payment}
              </Text>
              <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={copy.payment}>
                {paymentMethods.map((method) => (
                  <PaymentOption
                    key={method}
                    method={method}
                    selected={payment === method}
                    disabled={busy || (method === "wallet" && !walletAvailable)}
                    fee={paymentFee(method, catalogue)}
                    onSelect={setChoice}
                  />
                ))}
              </View>
              {!walletAvailable ? (
                <Text variant="body" tone="ivoryMuted" style={styles.small}>
                  {copy.walletUnavailable}
                </Text>
              ) : null}

              <Text variant="micro" tone="ivoryMuted" style={styles.groupLabel} accessibilityRole="header">
                {copy.summary}
              </Text>
              <View style={styles.summary}>
                {order.lines.map((line) => (
                  <View
                    key={`${line.product.slug}-${line.ml}`}
                    style={styles.line}
                    accessible
                    accessibilityLabel={`${line.product.name} ${line.ml}ml × ${line.quantity}: ${line.inStock ? formatPrice(line.lineTotal) : cartCopy.outOfStock}`}
                  >
                    <Text variant="body" style={styles.lineName}>{`${line.product.name} ${line.ml}ml × ${line.quantity}`}</Text>
                    {line.inStock ? (
                      <Price value={line.lineTotal} variant="body" tone="ivory" />
                    ) : (
                      <Text variant="label" tone="gold200">
                        {cartCopy.outOfStock}
                      </Text>
                    )}
                  </View>
                ))}
                <Totals totals={totals} onRequest={order.hasPriceOnRequest} showCod />
              </View>
            </View>
          ) : null}

          {step === "pay" ? (
            <PayStep
              headingRef={heading}
              total={totals.total}
              uploadError={uploadError}
              setUploadError={setUploadError}
              onBack={() => show("details")}
              disabled={busy}
            />
          ) : null}

          {step === "done" && placed ? <DoneStep headingRef={heading} id={placed.id} payment={placed.payment} onClose={close} /> : null}

          {problem && step !== "done" ? (
            <View style={styles.problem} accessibilityLiveRegion="assertive">
              <Text variant="body" tone="gold200">
                {MESSAGES[problem] ?? copy.error}
              </Text>
              {fallback ? (
                <Button
                  variant="outline"
                  label={copy.errorWhatsapp}
                  icon={<Icon name="whatsapp" size={16} />}
                  onPress={() => void Linking.openURL(fallback)}
                />
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {step !== "done" ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.total} accessible accessibilityLabel={`${cartCopy.total}: ${formatPrice(totals.total)}`}>
              <Text variant="micro" tone="ivoryMuted">
                {cartCopy.total}
              </Text>
              <Price value={totals.total} variant="h3" tone="gold200" numberOfLines={1} adjustsFontSizeToFit />
            </View>
            <Button
              label={label}
              loading={busy}
              disabled={busy || order.lines.length === 0 || (step === "details" && soldOut)}
              haptic="none"
              onPress={() => (step === "pay" ? onPay() : void onDetails())}
              style={styles.submit}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink900 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.gold800,
  },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.35 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 20 },
  step: { gap: 18 },
  groupLabel: { marginTop: 10 },
  options: { gap: 10 },
  small: { fontSize: 13, lineHeight: 19 },
  summary: { gap: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold800, backgroundColor: palette.ink950 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lineName: { flex: 1 },
  problem: { gap: 12, padding: 16, borderWidth: 1, borderColor: palette.gold600, backgroundColor: palette.ink950 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.gold700,
    backgroundColor: palette.ink950,
  },
  total: { flexShrink: 1, minWidth: 90 },
  submit: { flex: 1 },
});
