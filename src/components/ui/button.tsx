import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /* Na crnoj podlozi hover MORA da posvetli — brand-600 bi na hover-u
           izgledao kao da je dugme onemogućeno, pa se ide na brand-500. */
        primary:
          "bg-brand text-cream shadow-soft hover:bg-brand-500 hover:shadow-lift",
        outline:
          "border border-ink-600 bg-transparent text-cream hover:border-brand-500 hover:bg-brand/10 hover:text-brand-400",
        /* Tekst je 80% cream: puni cream bez pozadine se na tamnom čita kao
           primarna akcija i „krade" pažnju od pravog CTA-a. */
        ghost:
          "bg-transparent text-cream/80 hover:bg-ink-700 hover:text-cream",
        /* Amber sa flajera — za retke akcije koje moraju da preskoče plavu
           (npr. „spašavanje podataka"). Tekst je ink jer je amber presvetao. */
        accent:
          "bg-accent font-semibold text-ink shadow-soft hover:bg-accent-400 hover:shadow-lift",
      },
      size: {
        sm: "h-9 px-4 text-[0.9rem]",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-[3.25rem] px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Kad je `true`, stilovi se primenjuju na dete (npr. <Link>/<a>) umesto da se
   * renderuje <button>. Sprečava nevalidan ugnježden klik-element i čuva
   * semantiku linka. (Mini Slot pattern, bez dodatnih zavisnosti.)
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        className: cn(classes, child.props.className),
        ref,
      } as React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<unknown> });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
