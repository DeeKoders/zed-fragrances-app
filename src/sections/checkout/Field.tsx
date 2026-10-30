import { useState, type ComponentRef, type Ref } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Text } from "@/components/ui/Text";
import { palette } from "@/theme/palette";
import { fonts } from "@/theme/typography";

type FieldProps = TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  hint?: string;
  error?: string;
};

/** A labelled checkout field with its hint and inline error. */
export function Field({ ref, label, hint, error, multiline, style, onFocus, onBlur, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.root}>
      <Text variant="micro" tone="ivoryMuted">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled: props.editable === false }}
        aria-invalid={Boolean(error)}
        placeholderTextColor={palette.ivoryMuted}
        selectionColor={palette.gold300}
        cursorColor={palette.gold300}
        multiline={multiline}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.invalid : null,
          style,
        ]}
      />
      {error ? (
        <Text variant="body" tone="gold200" style={styles.message} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="body" tone="ivoryMuted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.ink950,
    color: palette.ivory,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  multiline: { minHeight: 104, textAlignVertical: "top" },
  focused: { borderColor: palette.gold300 },
  invalid: { borderColor: palette.gold500 },
  message: { fontSize: 13, lineHeight: 19 },
});
