import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/lib/data";

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const priceLabel =
    listing.priceType === "negotiable"
      ? "შეთანხმებით"
      : `€${listing.priceValue}${listing.priceType === "hourly" ? "/სთ" : ""}`;

  const cityLabel = Array.isArray(listing.city)
    ? listing.city.slice(0, 2).join(", ")
    : listing.city;

  return (
    <Link
      href={`/listing/${listing.slug ?? listing.id}`}
      className="group block bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.photo ? (
          <img
            src={listing.photo}
            alt={listing.providerName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <img
            src="/default-avatar.svg"
            alt={listing.providerName}
            className="w-full h-full object-cover"
          />
        )}
        {listing.isVip && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-0 font-display text-xs">
            VIP
          </Badge>
        )}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 text-sm font-semibold text-foreground">
          {priceLabel}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {listing.providerName}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">{listing.profession}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <MapPin className="h-3 w-3" />
          {cityLabel}, {listing.country}
        </div>
        <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            {listing.languages.slice(0, 2).join(", ")}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
