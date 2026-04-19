import supabase from "@/lib/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTPInput } from "input-otp";
import { toast } from "sonner";
import { Scale } from "lucide-react";

export default function LoginPage() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const signIn = () => {
    setSendingEmail(true);
    supabase.auth
      .signInWithOtp({
        email: signInEmail,
        options: { emailRedirectTo: window.location.origin },
      })
      .then(({ error }) => {
        if (error) {
          if (error.code === "over_email_send_rate_limit") {
            toast.error("Too many requests.", {
              description: error.message,
            });
          } else {
            toast.error("Could not send login email.", {
              description: error.message,
            });
          }
        } else {
          setEmailSent(true);
        }
      })
      .finally(() => setSendingEmail(false));
  };

  const disabled =
    sendingEmail ||
    !signInEmail?.includes("@") ||
    !signInEmail?.includes(".") ||
    signInEmail?.length < 5;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Law Office</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your matters and forms.
          </p>
        </div>

        {emailSent ? (
          <div className="flex flex-col gap-6 text-center">
            <div>
              <h2 className="text-lg font-semibold">Check your email</h2>
              {useOTP ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">
                    {signInEmail}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a magic link to{" "}
                  <span className="font-medium text-foreground">
                    {signInEmail}
                  </span>
                </p>
              )}
            </div>

            {useOTP ? (
              <div className="flex flex-col items-center gap-4">
                <OTPInput
                  disabled={verifyingOTP}
                  maxLength={6}
                  onComplete={(otp) => {
                    setVerifyingOTP(true);
                    supabase.auth
                      .verifyOtp({
                        email: signInEmail,
                        type: "email",
                        token: otp,
                      })
                      .then(({ error }) => {
                        if (error) {
                          toast.error("Invalid or expired code.", {
                            description: "Please wait a moment and try again.",
                          });
                        }
                      })
                      .finally(() => setVerifyingOTP(false));
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </OTPInput>
                {verifyingOTP && (
                  <LoadingSpinner className="text-muted-foreground" size={20} />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to sign in.
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">or</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-1"
                    onClick={() => setUseOTP(true)}
                  >
                    use a one-time code
                  </Button>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>
                Don't see it? Check your spam folder.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setEmailSent(false);
                  setUseOTP(false);
                }}
              >
                Use a different email
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={signInEmail}
              disabled={sendingEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) signIn();
              }}
            />
            <Button disabled={disabled} onClick={signIn}>
              {sendingEmail ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : null}
              Continue with Email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
