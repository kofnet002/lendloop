import { SignIn } from "@clerk/nextjs";
import { AuthPage, SIGNED_OUT_PAGE } from "@/components/layout/auth-page";

export default function SignInPage() {
  return (
    <AuthPage>
      <SignIn withSignUp fallbackRedirectUrl="/board" appearance={SIGNED_OUT_PAGE} />
    </AuthPage>
  );
}
