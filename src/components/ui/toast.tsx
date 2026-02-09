import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = ToastPrimitives.Viewport;

const Toast = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>) => (
  <ToastPrimitives.Root
    className={cn(
      "card row-between shadow-soft",
      className,
    )}
    {...props}
  />
);

const ToastTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>) => (
  <ToastPrimitives.Title className={cn("text-sm font-semibold", className)} {...props} />
);

const ToastDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>) => (
  <ToastPrimitives.Description className={cn("text-sm text-[var(--muted)]", className)} {...props} />
);

const ToastAction = ToastPrimitives.Action;
const ToastClose = ToastPrimitives.Close;

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose };
