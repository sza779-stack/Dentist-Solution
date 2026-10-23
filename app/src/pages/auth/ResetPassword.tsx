import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';

const schema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your password'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setValue('token', token);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token: values.token, newPassword: values.newPassword });
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter the reset token and your new password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Reset Token</Label>
            <Input placeholder="Paste reset token" {...register('token')} />
            {errors.token && (
              <p className="text-sm text-red-500">{errors.token.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" {...register('newPassword')} />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
