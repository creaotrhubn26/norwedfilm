import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, KeyRound, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteSetting } from "@shared/schema";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";

interface SettingsForm {
  siteName: string;
  siteTagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
  aboutText: string;
}

interface ApiKeyStatus {
  enabled: boolean;
  source: "database" | "environment" | "none";
  rotatedAt: string | null;
  rotatedBy: string | null;
  rotatedIp: string | null;
}

interface RotateApiKeyResponse {
  success: boolean;
  apiKey: string;
  rotatedAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [rotatedApiKey, setRotatedApiKey] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery<SiteSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsForm>({
    defaultValues: {
      siteName: "Norwed Film",
      siteTagline: "Love stories elegantly told",
      contactEmail: "hello@norwedfilm.no",
      contactPhone: "+47 123 45 678",
      address: "Oslo, Norway",
      instagramUrl: "https://instagram.com/norwedfilm",
      facebookUrl: "",
      aboutText: "",
    },
  });

  const { data: apiKeyStatus } = useQuery<ApiKeyStatus>({
    queryKey: ["/api/admin/api-key/status"],
  });

  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, s) => {
        acc[s.key] = s.value || "";
        return acc;
      }, {} as Record<string, string>);

      form.reset({
        siteName: settingsMap.siteName || "Norwed Film",
        siteTagline: settingsMap.siteTagline || "Love stories elegantly told",
        contactEmail: settingsMap.contactEmail || "hello@norwedfilm.no",
        contactPhone: settingsMap.contactPhone || "+47 123 45 678",
        address: settingsMap.address || "Oslo, Norway",
        instagramUrl: settingsMap.instagramUrl || "https://instagram.com/norwedfilm",
        facebookUrl: settingsMap.facebookUrl || "",
        aboutText: settingsMap.aboutText || "",
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) => apiRequest("POST", "/api/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const rotateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/api-key/rotate");
      return response.json() as Promise<RotateApiKeyResponse>;
    },
    onSuccess: (data) => {
      setRotatedApiKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-key/status"] });
      toast({ title: "API key rotert", description: "Ny nøkkel er generert. Kopier den nå." });
    },
    onError: () => {
      toast({ title: "Rotasjon feilet", description: "Kunne ikke rotere API key.", variant: "destructive" });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  const copyApiKey = async () => {
    if (!rotatedApiKey) return;
    try {
      await navigator.clipboard.writeText(rotatedApiKey);
      toast({ title: "Kopiert", description: "Ny API key er kopiert til utklippstavlen." });
    } catch {
      toast({ title: "Kopiering feilet", description: "Klarte ikke kopiere API key.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="p-6 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic site information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-site-name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="siteTagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-tagline" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Contact details displayed on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>
                  Links to your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://instagram.com/..." data-testid="input-instagram" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://facebook.com/..." data-testid="input-facebook" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Section</CardTitle>
                <CardDescription>
                  Text for the about page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="aboutText"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[150px]"
                          placeholder="Write about your business..."
                          data-testid="input-about-text"
                        />
                      </FormControl>
                      <FormDescription>
                        This text will be displayed on the about page
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  API Key Rotation
                </CardTitle>
                <CardDescription>
                  Roter nøkkel for ekstern admin-API tilgang (`x-api-key` / `Bearer`).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Status: <span className="font-medium text-foreground">{apiKeyStatus?.enabled ? "Aktiv" : "Ikke satt"}</span></p>
                  <p>Kilde: <span className="font-medium text-foreground">{apiKeyStatus?.source || "ukjent"}</span></p>
                  <p>Sist rotert: <span className="font-medium text-foreground">{apiKeyStatus?.rotatedAt ? new Date(apiKeyStatus.rotatedAt).toLocaleString() : "aldri"}</span></p>
                  <p>Roterte som: <span className="font-medium text-foreground">{apiKeyStatus?.rotatedBy || "ukjent"}</span></p>
                  <p>Kilde-IP: <span className="font-medium text-foreground">{apiKeyStatus?.rotatedIp || "ukjent"}</span></p>
                </div>

                <Button
                  type="button"
                  onClick={() => rotateApiKeyMutation.mutate()}
                  disabled={rotateApiKeyMutation.isPending}
                  data-testid="button-rotate-api-key"
                >
                  {rotateApiKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Roter API Key
                </Button>

                {rotatedApiKey && (
                  <div className="space-y-2">
                    <FormLabel>Ny API Key (vises kun nå)</FormLabel>
                    <div className="flex gap-2">
                      <Input value={rotatedApiKey} readOnly data-testid="input-rotated-api-key" />
                      <Button type="button" variant="outline" onClick={copyApiKey} data-testid="button-copy-api-key">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
