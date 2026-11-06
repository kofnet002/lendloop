import { SignUp } from "@clerk/nextjs";
import { AuthPage, SIGNED_OUT_PAGE } from "@/components/layout/auth-page";

export default function SignUpPage() {
  return (
    <AuthPage>
      <SignUp fallbackRedirectUrl="/board" appearance={SIGNED_OUT_PAGE} />
    </AuthPage>
  );
}
