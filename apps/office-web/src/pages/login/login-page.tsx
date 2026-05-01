import supabase from "@/apis/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OTPInput } from "input-otp";
import { InputOTPSlot, InputOTPGroup } from "@/components/ui/input-otp";
import { toast } from "sonner";

export default function LoginPage() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [signInEmail, setSignInEmail] = useState<string>("");
  const [signUpEmailSent, setSignUpEmailSent] = useState<boolean>(false);
  const [useOTP, setUseOTP] = useState<boolean>(false);
  const [verifyingOTP, setVerifyingOTP] = useState<boolean>(false);
  const signIn = () => {
    localStorage.setItem("makase.com:loggedInHref", window.location.href);
    setSendingEmail(true);
    supabase.auth.signInWithOtp({
      email: signInEmail,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false,
      }
    }).then(({ error }) => {
      if (error) {
        if (error.code === "over_email_send_rate_limit") {
          toast.error("Whoa there! You've sent too many requests.", {
            description: error.message
          });
        } else if (error.code === "otp_disabled" || error.code === "signup_disabled") {
          toast.error("This email isn't on the invite list.", {
            description: "Ask an admin to invite you, then try again.",
          });
        } else {
          toast.error("Couldn't send login link.", { description: error.message });
        }
      } else {
        setSignUpEmailSent(true);
      }
    })
    .finally(() => setSendingEmail(false));
  };


  const disabled = sendingEmail || !signInEmail?.includes("@") || !signInEmail?.includes(".") || signInEmail?.length < 5;


  return <div className="flex flex-col gap-2 items-center justify-center h-screen">
    <div className="h-1/2 flex flex-col items-center justify-end">
      <h1 className="text-4xl md:text-6xl font-bold">Makase</h1>
    </div>
    <div className="h-1/2">
      {
        signUpEmailSent ?
          <div className="h-full flex flex-col justify-between">
            <div className="flex flex-col gap-2 items-center">
              <h3 className="text-center text-lg font-bold">Check your email inbox</h3>
              {
                useOTP ? <div className="flex flex-col gap-2 items-center">
                  <p className="text-center text-sm text-muted-foreground px-10">Enter the 6-digit code sent to <span className="font-bold">{signInEmail}</span> here:</p>
                  <OTPInput disabled={verifyingOTP} maxLength={6} onComplete={(otp) => {
                    setVerifyingOTP(true);
                    supabase.auth.verifyOtp({
                      email: signInEmail,
                      type: "email",
                      token: otp
                    }).then(({ error }) => {
                      if (error) {
                        console.log(error);
                        toast.error("The code you entered is incorrect or expired.", {
                          description: 'Please wait a bit and try again.'
                        });
                      }
                    }).finally(() => setVerifyingOTP(false));
                  }}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                      {verifyingOTP && <LoadingSpinner className="text-muted-foreground" height={30} width={30} />}
                    </InputOTPGroup>
                  </OTPInput>
                </div>
                  :
                  <div className="flex flex-col items-center">
                    <p className="text-center text-sm text-muted-foreground px-10">We've sent you a magic link to <span className="font-bold">{signInEmail}</span>. </p>
                    <p className="text-center text-sm text-muted-foreground px-10">Click the link in the email to login.</p>
                    <div className="flex flex-row items-center">
                      <p className="text-center text-sm text-muted-foreground font-bold">OR</p>
                      <Button variant="link" size="sm" onClick={() => setUseOTP(true)}>Login with OTP</Button>
                    </div>
                  </div>
              }
            </div>
            <div className="flex flex-col items-center">
              <p className="text-center text-muted-foreground">Don't see the email? Check your spam folder.</p>
              <p className="text-center text-muted-foreground">Wrong email?<Button variant="link" size="sm" onClick={() => {
                setSignUpEmailSent(false);
                setUseOTP(false);
              }}>Re-enter your email</Button></p>
            </div>
          </div>
          :
          <div className=" h-full flex flex-col gap-2">
            <h2 className="text-2xl font-bold mb-2">Enter your email to begin!</h2>
            <Input type="email" placeholder="Email" value={signInEmail} disabled={sendingEmail} onChange={(e) => setSignInEmail(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter" && !disabled) {
                signIn();
              }
            }} />
            <Button size="sm" disabled={disabled} onClick={signIn}>
              {sendingEmail ?
                <LoadingSpinner className="w-4 h-4" /> :
                "Login/Signup"
              }
            </Button>
          </div>
      }

    </div>
  </div>
}