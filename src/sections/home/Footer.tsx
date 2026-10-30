import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { announce } from "@/lib/a11y";
import { subscribe } from "@/lib/newsletter";
import { whatsappUrl } from "@/lib/whatsapp";
import { palette } from "@/theme/palette";
import { fonts } from "@/theme/typography";

const copy = brand.copy.footer;

/** The website footer's content: logo, links, socials, newsletter, disclaimer, © and the app version. */
export function Footer({ bottomInset = 0 }: { bottomInset?: number }) {
  const version = Constants.expoConfig?.version ?? "";
  return (
    <View style={[styles.root, { paddingBottom: 40 + bottomInset }]}>
      <View style={styles.brand}>
        <Logo kind="full" width={180} />
        <Text variant="editorial" tone="ivoryMuted" align="center">
          {brand.taglines.quality}
        </Text>
      </View>
      <DiamondDivider />

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text variant="micro" tone="gold300" accessibilityRole="header">
            {copy.fragrances}
          </Text>
          {products.map((product) => (
            <FooterLink key={product.slug} label={product.name} onPress={() => router.push(`/fragrances/${product.slug}`)} />
          ))}
        </View>
        <View style={styles.column}>
          <Text variant="micro" tone="gold300" accessibilityRole="header">
            {copy.connect}
          </Text>
          {brand.socials.map((social) => (
            <FooterLink key={social.label} label={social.label} onPress={() => void Linking.openURL(social.href)} external />
          ))}
          <FooterLink label={copy.whatsapp} onPress={() => void Linking.openURL(whatsappUrl())} external />
          <FooterLink label={copy.website} onPress={() => void Linking.openURL(brand.siteUrl)} external />
        </View>
      </View>

      <Newsletter />

      <Text variant="body" tone="ivoryMuted" style={styles.small}>
        {brand.disclaimer}
      </Text>
      <View style={styles.meta}>
        <Text variant="micro" tone="ivoryMuted">{`© ${new Date().getFullYear()} ${brand.name}`}</Text>
        <Text variant="micro" tone="ivoryMuted">{`${copy.version} ${version}`}</Text>
      </View>
    </View>
  );
}

function FooterLink({ label, onPress, external = false }: { label: string; onPress: () => void; external?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link} hitSlop={4}>
      <Text variant="body" tone="ivory">
        {label}
      </Text>
      {external ? <Icon name="external" size={14} color={palette.ivoryMuted} /> : null}
    </Pressable>
  );
}

function Newsletter() {
  const n = copy.newsletter;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const submit = async () => {
    setStatus("sending");
    try {
      await subscribe(email.trim());
      setStatus("done");
      announce(n.success);
    } catch {
      setStatus("error");
      announce(n.error);
    }
  };
  return (
    <View style={styles.newsletter}>
      <Text variant="h3">{n.title}</Text>
      <Text variant="body" tone="ivoryMuted">
        {n.text}
      </Text>
      {status === "done" ? (
        <Text variant="label" tone="gold200" accessibilityLiveRegion="polite">
          {n.success}
        </Text>
      ) : (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={n.placeholder}
            placeholderTextColor={palette.ivoryMuted}
            accessibilityLabel={n.label}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
            style={styles.input}
          />
          {status === "error" ? (
            <Text variant="body" tone="gold200" accessibilityLiveRegion="polite">
              {n.error}
            </Text>
          ) : null}
          <Button variant="outline" label={n.submit} loading={status === "sending"} onPress={() => void submit()} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 48, gap: 28, backgroundColor: palette.ink950, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.gold800 },
  brand: { alignItems: "center", gap: 12 },
  columns: { flexDirection: "row", gap: 20 },
  column: { flex: 1, gap: 6 },
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  newsletter: { gap: 12 },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold700,
    paddingHorizontal: 16,
    color: palette.ivory,
    fontFamily: fonts.body,
    fontSize: 16,
    backgroundColor: palette.ink900,
  },
  small: { fontSize: 13, lineHeight: 20 },
  meta: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
});
