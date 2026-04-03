"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface SaveButtonProps {
  listingId: number;
}

const SaveButton = ({ listingId }: SaveButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      saved
        ? api.delete(`/client/saved-listings/${listingId}`)
        : api.post(`/client/saved-listings/${listingId}`),
    onSuccess: () => {
      setSaved((s) => !s);
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
      toast.success(saved ? "შენახულებიდან წაიშალა." : "შენახულებში დაემატა.");
    },
    onError: () => toast.error("შეცდომა. სცადეთ ხელახლა."),
  });

  if (!user || user.role !== "client") return null;

  return (
    <Button
      className="w-full gap-2"
      size="lg"
      variant={saved ? "outline" : "default"}
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "შენახულებიდან წაშლა" : "შენახვა"}
    </Button>
  );
};

export default SaveButton;
