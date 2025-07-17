import React, { useState } from "react";
import { UserApplication } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";

export default function ApplyForAccess() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', or 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !reason) {
            setSubmitStatus('error');
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            await UserApplication.create({
                full_name: fullName,
                email,
                reason,
            });
            setSubmitStatus('success');
            setFullName("");
            setEmail("");
            setReason("");
        } catch (error) {
            console.error("Error submitting application:", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-slate-800">Request Access</CardTitle>
                    <CardDescription>
                        To access the Restaurant Pro dashboard, please submit an application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitStatus === 'success' ? (
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-green-800">Application Submitted!</h3>
                            <p className="text-green-700 mt-1">Your request has been sent for approval. You will be notified via email once a decision is made.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <Input
                                    id="fullName"
                                    placeholder="e.g. Jane Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Reason for Access</label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please describe why you need access to this system..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>
                            {submitStatus === 'error' && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <p>Please fill out all fields correctly.</p>
                                </div>
                            )}
                            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                <Send className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}