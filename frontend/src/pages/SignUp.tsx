import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Building2, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from '@/lib/api';

const signUpSchema = z.object({
  // Company Information
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  industry: z.string().min(1, "Please select an industry"),
  companySize: z.string().optional(),
  companyLocation: z.string().min(2, "Company location is required"),
  
  // Admin User Information
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  
  // Agreements
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  subscribeNewsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

const businessTypes = [
  "Manufacturer",
  "Distributor", 
  "Wholesaler",
  "Retailer",
  "Supplier",
  "Logistics Provider",
  "Other"
];

const industries = [
  "FMCG & Food",
  "Healthcare & Pharma",
  "Automotive",
  "Electronics & Technology", 
  "Apparel & Fashion",
  "Packaging & Materials",
  "Chemicals",
  "Agriculture",
  "Construction",
  "Other"
];

const companySizes = [
  "1-10 employees",
  "11-50 employees", 
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees"
];

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      companyName: "",
      businessType: "",
      industry: "",
      companySize: "",
      companyLocation: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      subscribeNewsletter: false,
    },
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      console.log('Registration successful:', user);
      
      // Redirect to dashboard or home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Show error message to user
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const watchPassword = form.watch("password");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-primary">
            <Building2 className="h-8 w-8" />
            <span>ChainLink Pro</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join thousands of companies optimizing their supply chains
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started with ChainLink Pro</CardTitle>
            <CardDescription>
              Set up your company workspace and admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Company Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Company Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      {...form.register("companyName")}
                    />
                    {form.formState.errors.companyName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select 
                      value={form.watch("businessType")} 
                      onValueChange={(value) => form.setValue("businessType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.businessType && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.businessType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select 
                      value={form.watch("industry")} 
                      onValueChange={(value) => form.setValue("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.industry && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.industry.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select 
                      value={form.watch("companySize")} 
                      onValueChange={(value) => form.setValue("companySize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyLocation">Company Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyLocation"
                        placeholder="Enter city, state/country"
                        className="pl-10"
                        {...form.register("companyLocation")}
                      />
                    </div>
                    {form.formState.errors.companyLocation && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.companyLocation.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admin User Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Admin User Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        className="pl-10"
                        {...form.register("fullName")}
                      />
                    </div>
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your work email"
                        className="pl-10"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="pl-10"
                        {...form.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        {...form.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Requirements */}
                {watchPassword && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Password Requirements:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={watchPassword.length >= 8 ? "text-green-600" : ""}>
                        • At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(watchPassword) ? "text-green-600" : ""}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(watchPassword) ? "text-green-600" : ""}>
                        • One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(watchPassword) ? "text-green-600" : ""}>
                        • One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(watchPassword) ? "text-green-600" : ""}>
                        • One special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <Separator />

              {/* Agreements */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={form.watch("agreeToTerms")}
                    onCheckedChange={(checked) => {
                      form.setValue("agreeToTerms", checked === true);
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
                {form.formState.errors.agreeToTerms && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.agreeToTerms.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="subscribeNewsletter"
                    checked={form.watch("subscribeNewsletter")}
                    onCheckedChange={(checked) => {
                      form.setValue("subscribeNewsletter", checked === true);
                    }}
                  />
                  <Label htmlFor="subscribeNewsletter" className="text-sm">
                    Subscribe to our newsletter for product updates and supply chain insights
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;