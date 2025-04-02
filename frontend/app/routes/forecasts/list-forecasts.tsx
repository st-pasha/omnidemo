import { set } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Spinner } from "~/components/custom/spinner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
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
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { chartsStore, type Chart } from "~/state/charts-store";
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
      {forecast && <ChartsSection />}
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

const ChartsSection = observer(() => {
  const charts = chartsStore.charts;
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold">Charts</h2>
      <div className="mb-4 mt-2">
        {charts.length === 0 ? (
          <div className="border rounded-lg px-4 py-3 text-stone-400 text-sm">
            No charts created
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 mt-4">
            {charts.map((chart) => (
              <ChartWidget key={chart.chartKey} chart={chart} />
            ))}
          </div>
        )}
      </div>
      <AddChartButton />
    </div>
  );
});

const AddChartButton = () => {
  const [open, setOpen] = useState(false);
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [agg, setAgg] = useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("x", x, "y", y, "agg", agg);
    chartsStore.createChart(x, y, agg);
    setOpen(false);
  };
  const onChangeY = (value: string) => {
    setY(value);
    if (value !== "forecast") setAgg("count");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Add Chart</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new chart</DialogTitle>
          <DialogDescription>
            Select which quantities you want on the x and y axes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Label htmlFor="x-axis" className="w-18">
              X axis:
            </Label>
            <Select name="x-axis" value={x} onValueChange={setX}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sku_id">SKU</SelectItem>
                <SelectItem value="facility_id">Facility</SelectItem>
                <SelectItem value="product_category">Product Category</SelectItem>
                <SelectItem value="chain">Chain</SelectItem>
                <SelectItem value="region">Region</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="y-axis" className="w-18">
              Y axis:
            </Label>
            <Select name="y-axis" value={y} onValueChange={onChangeY}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forecast">Forecast</SelectItem>
                <SelectItem value="sku_id">SKU</SelectItem>
                <SelectItem value="facility_id">Facility</SelectItem>
                <SelectItem value="product_category">Product Category</SelectItem>
                <SelectItem value="chain">Chain</SelectItem>
                <SelectItem value="region">Region</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="agg" className="w-18">
              Aggregate:
            </Label>
            <Select
              name="agg"
              value={agg}
              onValueChange={setAgg}
              disabled={y !== "forecast"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={!x || !y || !agg}>
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

const ChartWidget = observer(({ chart }: { chart: Chart }) => {
  if (chart.isLoading) {
    return (
      <div className="border rounded-lg p-4 w-96 min-h-64 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  const fields = chart.fields;
  const chartData = chart.chartData.map((row: any) => ({ x: row[0], y: row[1] }));

  const chartConfig: ChartConfig = {
    x: {
      label: fields[0],
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="border rounded-lg p-4 w-96 min-h-64">
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="x" tickLine={false} tickMargin={10} axisLine={false} />
          <YAxis dataKey="y" tickLine={true} />
          <Bar dataKey="y" fill="var(--color-desktop)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
});

export default ListForecastsPage;
