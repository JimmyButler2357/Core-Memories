import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, radii } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import TopBar from '@/components/TopBar';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * Forgot Password screen — lets the user request a password reset link.
 *
 * Think of it like going to the front desk of a hotel and saying
 * "I lost my keycard." The hotel (Supabase) sends a verification
 * letter (email) to prove it's really you, with a link to pick
 * a new keycard (password).
 *
 * Security note: We show the same success message whether the email
 * exists or not. This prevents attackers from checking if someone
 * has an account (called "user enumeration").
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = email.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await authService.resetPasswordForEmail(email.trim());
      // Always show success — even if email doesn't exist (security)
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      // Rate limit errors are the main ones we want to surface
      if (message.toLowerCase().includes('rate') || message.toLowerCase().includes('too many')) {
        setError('Too many requests. Please try again later.');
      } else {
        // For other errors, still show generic success to avoid
        // revealing whether the email exists. But log for debugging.
        console.warn('Reset password error:', message);
        setSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TopBar showBack title="" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        {/* Email field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!isLoading && !success}
            autoFocus
          />
        </View>

        {/* Feedback messages */}
        {error && <Text style={styles.error}>{error}</Text>}
        {success && (
          <Text style={styles.success}>
            If an account exists with that email, you'll receive a reset link.
          </Text>
        )}

        {/* Submit button */}
        <View style={styles.buttonWrap}>
          <PrimaryButton
            label={isLoading ? 'Sending...' : success ? 'Link Sent' : 'Send Reset Link'}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading || success}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    paddingBottom: spacing(8),
  },
  heading: {
    ...typography.sectionHeading,
    color: colors.text,
    marginBottom: spacing(2),
  },
  subtitle: {
    ...typography.onboardingTagline,
    color: colors.textSoft,
    marginBottom: spacing(8),
  },
  fieldGroup: {
    marginBottom: spacing(5),
  },
  label: {
    ...typography.formLabel,
    color: colors.text,
    marginBottom: spacing(2),
  },
  input: {
    ...typography.formLabel,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing(4),
  },
  success: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing(4),
  },
  buttonWrap: {
    marginTop: spacing(2),
  },
});
