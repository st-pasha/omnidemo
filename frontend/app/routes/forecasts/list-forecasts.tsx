import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Spinner } from "~/components/custom/spinner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { useCurrentUser } from "~/state/current-user";
import { forecastStore } from "~/state/forecasts-store";

const ListForecastsPage = observer(() => {
  const forecast = forecastStore.forecast;
  return (
    <div>
      <div className="flex items-center mb-2 ">
        <h1 className="text-xl font-bold grow">Forecasts</h1>
        <StartForecastButton />
      </div>

      {forecastStore.loading ? (
        <Spinner />
      ) : forecast === null ? (
        <div className="border rounded-lg px-4 py-3 text-stone-400">No forecasts</div>
      ) : (
        <ForecastWidget />
      )}
    </div>
  );
});

const StartForecastButton = () => {
  const [open, setOpen] = useState(false);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forecastStore.startForecast();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">New Forecast</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start forecast</DialogTitle>
          <DialogDescription>
            Are you sure you want to start a new forecast? This will overwrite any
            existing forecasts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogFooter className="sm:justify-start">
            <Button type="submit" className="cursor-pointer">
              Start
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ForecastWidget = observer(() => {
  const forecast = forecastStore.forecast;
  const job = forecastStore.job;
  const canPublish =
    job?.status === "completed" &&
    forecast?.status === "draft" &&
    useCurrentUser().username === "admin";
  const publish = () => {
    forecastStore.publishForecast();
  };

  return (
    <div className="border rounded-lg px-4 py-3 flex items-center">
      <div className="grow">
        <div className="flex gap-2">
          <div className="font-semibold">Forecast</div>
          <Badge className="h-4">{forecast?.status}</Badge>
        </div>
        {job?.status === "failed" && (
          <div className="text-red-500">
            Error: {job.error} (progress: {job.progress})
          </div>
        )}
        {job?.status === "running" && (
          <Progress value={job.progress * 100} className="my-2" />
        )}
        <div className="text-sm text-stone-400 ml-6">{forecast?.file_id}</div>
      </div>
      <div>{canPublish && <Button onClick={publish}>Publish</Button>}</div>
    </div>
  );
});

export default ListForecastsPage;
