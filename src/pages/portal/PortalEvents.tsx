import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Clock, ExternalLink } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export default function PortalEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["portal-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_events")
        .select("*")
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const upcoming = events?.filter((e) => !isPast(new Date(e.event_date)) || isToday(new Date(e.event_date))) ?? [];
  const past = events?.filter((e) => isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date))) ?? [];

  const EventCard = ({ event, isPastEvent = false }: { event: (typeof events extends (infer T)[] | undefined ? T : never); isPastEvent?: boolean }) => (
    <Card className={`border-border/60 ${isPastEvent ? "opacity-60" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Date block */}
          <div className="shrink-0 h-14 w-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-primary uppercase">
              {format(new Date(event.event_date), "MMM")}
            </span>
            <span className="text-lg font-bold text-primary leading-none">
              {format(new Date(event.event_date), "d")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
              {isToday(new Date(event.event_date)) && (
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Today</Badge>
              )}
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {event.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.start_time}{event.end_time ? ` – ${event.end_time}` : ""}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>

          {event.event_link && !isPastEvent && (
            <Button asChild variant="outline" size="sm" className="shrink-0 text-xs gap-1.5">
              <a href={event.event_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Join
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-1">Upcoming partner calls, webinars, and trainings.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : !events?.length ? (
        <div className="py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon for partner calls, trainings, and webinars.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h2>
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Past Events</h2>
              {past.map((e) => <EventCard key={e.id} event={e} isPastEvent />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
