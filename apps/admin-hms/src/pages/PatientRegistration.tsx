import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatientRegistrationSchema, type PatientRegistrationInput, type PatientRegistrationResponse } from '@mediportal/shared-types';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@mediportal/ui-core';
import { Button } from '@mediportal/ui-core';
import { Input } from '@mediportal/ui-core';
import { Label } from '@mediportal/ui-core';
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react';

interface PatientRegistrationPageProps {
  onViewChart?: (id: string) => void;
}

const PatientRegistrationPage: React.FC<PatientRegistrationPageProps> = ({ onViewChart }) => {
  const [success, setSuccess] = useState<PatientRegistrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientRegistrationInput>({
    resolver: zodResolver(PatientRegistrationSchema),
    defaultValues: {
      gender: 'MALE',
    }
  });

  const onSubmit = async (data: PatientRegistrationInput) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post<PatientRegistrationResponse>('/patients/register', data);
      setSuccess(response.data);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please verify branch ID and data.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-green-500">
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Registration Successful!</h2>
              <p className="text-muted-foreground text-lg">
                Patient profile and portal account have been created.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Patient Name</span>
                <span className="text-lg font-semibold">{success.user.name}</span>
              </div>
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg">
                <span className="text-lg font-bold text-primary uppercase tracking-wider">Unique Health ID (UHID)</span>
                <span className="text-2xl font-black text-primary font-mono">{success.uhid}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setSuccess(null)}>
                Register Another
              </Button>
              <Button 
                className="flex-1"
                onClick={() => onViewChart && onViewChart(success.id)}
              >
                Open Clinical Chart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="bg-white border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">New Patient Registration</CardTitle>
              <CardDescription>Enroll a new patient into the clinical medical record system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {error && (
              <div className="col-span-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Quincy Doe" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register('dob')} />
              {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select 
                id="gender"
                {...register('gender')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-destructive mt-1">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchId">Assigned Branch (ID)</Label>
              <Input id="branchId" placeholder="Branch UUID" {...register('branchId')} />
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Use branch-1-uuid for demo</p>
              {errors.branchId && <p className="text-xs text-destructive mt-1">{errors.branchId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Primary Contact</Label>
              <Input id="contact" placeholder="+1 (555) 000-0000" {...register('contact')} />
              {errors.contact && <p className="text-xs text-destructive mt-1">{errors.contact.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Info</Label>
              <Input id="emergencyContact" placeholder="Contact name and number" {...register('emergencyContact')} />
              {errors.emergencyContact && <p className="text-xs text-destructive mt-1">{errors.emergencyContact.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t mt-8 py-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => reset()} disabled={loading}>
              Reset Form
            </Button>
            <Button type="submit" className="px-8 shadow-md" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating UHID...
                </>
              ) : (
                'Register Patient'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PatientRegistrationPage;
