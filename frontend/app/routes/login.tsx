import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Spinner } from "~/components/custom/spinner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useCurrentUser } from "~/state/current-user";
import { api } from "~/lib/api";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  return (
    <div
      className="flex min-h-svh w-full items-center justify-center bg-zinc-200 p-6
        md:p-10"
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
};
LoginPage.displayName = "LoginPage";

const formSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(256),
});
type FormType = z.infer<typeof formSchema>;

const ZResponseSchema = z.object({
  access_token: z.string(),
  username: z.string(),
  permission: z.enum(["normal", "admin"]),
});

// -------------------------------------------------------------------------------------

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });
  const onSubmit = async (values: FormType) => {
    form.clearErrors();
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/login", values);
      const data = await response.json(ZResponseSchema);
      useCurrentUser().logIn(data.username, 0, data.access_token);
    } catch (error: any) {
        console.log("error", error);
      form.setError("password", {
        type: "manual",
        message: error.toString(),
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 self-center">
        <h1 className="text-3xl font-medium">Omni Demo</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-1">
                  <FormField
                    control={form.control}
                    name="username"
                    render={UsernameInput}
                  />
                </div>
                <div className="grid gap-1">
                  <FormField
                    control={form.control}
                    name="password"
                    render={PasswordInput}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner /> : null}
                  Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
LoginForm.displayName = "LoginForm";

function UsernameInput({ field }: { field: ControllerRenderProps<FormType> }) {
  return (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input autoComplete="username" type="text" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
UsernameInput.displayName = "UsernameInput";

function PasswordInput({ field }: { field: ControllerRenderProps<FormType> }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <FormItem>
      <FormLabel>Password</FormLabel>
      <div className="relative">
        <FormControl>
          <Input
            autoComplete="current-password"
            type={showPassword ? "text" : "password"}
            {...field}
          />
        </FormControl>
        <button
          className="absolute inset-y-1 right-1 rounded px-3 outline-1
            hover:bg-slate-100 hover:outline"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setShowPassword(!showPassword);
          }}
        >
          {showPassword ? <Eye /> : <EyeOff />}
        </button>
      </div>
      <FormMessage />
    </FormItem>
  );
}
PasswordInput.displayName = "PasswordInput";

export { LoginPage };
