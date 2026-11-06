import { SignUp } from "@clerk/nextjs";
import { AuthPage } from "@/components/layout/auth-page";

export default function SignUpPage() {
  return (
    <AuthPage>
      <SignUp fallbackRedirectUrl="/board" />
    </AuthPage>
  );
}
