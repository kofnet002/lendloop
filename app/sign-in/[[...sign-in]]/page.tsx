import { SignIn } from "@clerk/nextjs";
import { AuthPage } from "@/components/layout/auth-page";

export default function SignInPage() {
  return (
    <AuthPage>
      <SignIn withSignUp fallbackRedirectUrl="/board" />
    </AuthPage>
  );
}
