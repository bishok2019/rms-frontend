import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorFunction, successFunction } from "@/components/common/Alert";
import {
  getUserProfile,
  updateProfile,
  type UpdateProfilePayload,
  type UserProfileResponse,
} from "@/pages/Authentication/Store/api";

type ProfileForm = {
  username: string;
  email: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  bio: string;
};

const emptyForm: ProfileForm = {
  username: "",
  email: "",
  fullName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  bio: "",
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001"
).replace(/\/$/, "");

const buildPhotoCandidates = (rawUrl?: string): string[] => {
  if (!rawUrl) return [];
  if (/^blob:|^data:|^https?:\/\//i.test(rawUrl)) return [rawUrl];

  const clean = rawUrl.replace(/^\/+/, "");
  const mediaClean = clean.replace(/^media\//, "");

  return Array.from(
    new Set([
      `${API_BASE_URL}/${clean}`,
      `${API_BASE_URL}/media/${mediaClean}`,
      `${API_BASE_URL}/${mediaClean}`,
    ])
  );
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const user = useMemo(() => {
    if (!profile) return null;
    return profile.user
      ? profile.user
      : {
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          fullName: profile.fullName,
        };
  }, [profile]);

  const fullName = useMemo(() => {
    if (form.fullName.trim()) return form.fullName;
    const joined = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return joined || user?.fullName || user?.username || "User";
  }, [form.firstName, form.middleName, form.lastName, form.fullName, user]);

  const photoCandidates = useMemo(
    () => buildPhotoCandidates(photoPreview || user?.photo),
    [photoPreview, user?.photo]
  );

  const photoUrl = photoCandidates[photoIndex] || "";

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const payload = response?.data || null;
      setProfile(payload);

      const formValues: ProfileForm = {
        username: payload?.user?.username || payload?.username || "",
        email: payload?.user?.email || payload?.email || "",
        fullName: payload?.user?.fullName || payload?.fullName || "",
        firstName: payload?.user?.firstName || payload?.firstName || "",
        middleName: payload?.user?.middleName || payload?.middleName || "",
        lastName: payload?.user?.lastName || payload?.lastName || "",
        bio: "",
      };
      setForm(formValues);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error: any) {
      errorFunction(error?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    setPhotoIndex(0);
  }, [photoCandidates.length, user?.photo, photoPreview]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const onSave = async () => {
    const trimmedBio = form.bio.trim();

    try {
      setSaving(true);
      if (photoFile) {
        const formData = new FormData();
        formData.append("username", form.username);
        formData.append("email", form.email);
        formData.append("fullName", form.fullName);
        formData.append("firstName", form.firstName);
        formData.append("middleName", form.middleName);
        formData.append("lastName", form.lastName);
        if (trimmedBio) {
          formData.append("profile[bio]", trimmedBio);
        }
        formData.append("photo", photoFile);
        await updateProfile(formData);
      } else {
        const body: UpdateProfilePayload & {
          username?: string;
          email?: string;
          fullName?: string;
        } = {
          username: form.username,
          email: form.email,
          fullName: form.fullName,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          profile: trimmedBio ? { bio: trimmedBio } : {},
        };
        await updateProfile(body);
      }
      successFunction("Profile updated successfully.");
      await loadProfile();
    } catch (error: any) {
      errorFunction(error?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoDoubleClick = () => {
    if (photoUrl) {
      setIsDialogOpen(true);
    }
  };

  const handlePhotoError = () => {
    setPhotoIndex((prev) => {
      if (prev < photoCandidates.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  };

  return (
    <div className="p-0 h-full">
      <Card className="w-full max-w-none h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold">Profile</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View your account details and edit profile information.
            </p>
          </div>

          <Button onClick={onSave} disabled={loading || saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Update Profile
          </Button>
        </CardHeader>

        <CardContent className="flex-1 pt-6 pb-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading profile...
            </div>
          ) : (
            <div className="space-y-5 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5 h-full items-stretch">
                <div className="rounded-xl border border-border/60 p-4 bg-background/40 h-full flex flex-col gap-4">
                  <div className="flex flex-col items-center gap-4 pt-1">
                    <div
                      className="h-64 w-64 rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer ring-1 ring-border/60"
                      onDoubleClick={handlePhotoDoubleClick}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={`${fullName} profile`}
                          className="h-full w-full object-cover"
                          onError={handlePhotoError}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No photo</span>
                      )}
                    </div>
                    <div className="w-full space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <Input
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        onChange={onPhotoChange}
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Double-click image to open large preview.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Add a short bio"
                      value={form.bio}
                      onChange={onChange}
                      disabled={saving}
                      className="min-h-28 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-4 h-full flex flex-col pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={form.username}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={form.middleName}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[96vw] sm:w-[92vw] lg:w-[86vw] !max-w-[96vw] sm:!max-w-[92vw] lg:!max-w-[1400px] h-[92vh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Enlarged profile"
              className="w-auto h-auto max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
              onError={handlePhotoError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
