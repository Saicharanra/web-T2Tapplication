import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const variantStyles = {
  primary: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-primary/10",
  secondary: "bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-secondary/10",
  success: "bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-success/10",
  warning: "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-warning/10",
  destructive: "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:shadow-destructive/10",
};

const iconVariantStyles = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
  trend,
  className
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/30 p-6 transition-all duration-300 hover:shadow-2xl bg-glass animate-fade-in",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs font-medium mt-2",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last period
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
