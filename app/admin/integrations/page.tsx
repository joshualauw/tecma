import { MessageCircleCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex h-full flex-col gap-4">
            <MessageCircleCodeIcon className="size-6" />
            <div className="space-y-1">
              <h2 className="font-bold">Web Link</h2>
              <p className="text-muted-foreground text-sm">
                Use our custom web link and start receiving messages from your customers directly in our platform.
              </p>
            </div>
            <Button className="mt-auto w-fit">Connect</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
