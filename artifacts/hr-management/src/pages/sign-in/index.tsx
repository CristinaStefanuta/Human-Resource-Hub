import { SignIn } from '@clerk/react';
import { CheckCircle2 } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">PeopleHub</span>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}
