import { SendHorizonal } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Spinner } from "~/components/custom/spinner";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/state/current-user";
import { insightsStore, type TInsight } from "~/state/insights-store";

//
const ListInsightsPage = observer(() => {
  const insights = insightsStore.insights;

  return (
    <div className="h-full max-h-dvh flex flex-col relative">
      <div className="grow shrink max-h-[calc(100dvh-3.5rem)]">
        <ScrollArea className="flex flex-col gap-4 overflow-hidden pt-4">
          {insightsStore.loading ? (
            <Spinner />
          ) : (
            insights.map((insight) => (
              <MessageWidget key={insight.id} insight={insight} />
            ))
          )}
        </ScrollArea>
      </div>
      <div className="h-[3.5rem] z-100 bg-white">
        <ChatInput />
      </div>
    </div>
  );
});

const MessageWidget = ({ insight }: { insight: TInsight }) => {
  const myUsername = useCurrentUser().username;
  const editable = myUsername === insight.username;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={cn(
        `flex items-top gap-2 border border-transparent px-2 rounded-lg py-1`,
        editable && "hover:border-stone-300 hover:shadow cursor-pointer",
      )}>
      <Avatar className="mt-1">
        <AvatarFallback>{insight.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      {isEditing ? (
        <EditMessage insight={insight} onFinish={() => setIsEditing(false)} />
      ) : (
        <div
          className="flex flex-col gap-1"
          onClick={editable ? () => setIsEditing(true) : undefined}>
          <span className="text-sm font-semibold">{insight.username}</span>
          <span className="text-sm text-zinc-600">{insight.message}</span>
        </div>
      )}
    </div>
  );
};

const EditMessage = ({
  insight,
  onFinish,
}: {
  insight: TInsight;
  onFinish: () => void;
}) => {
  const [message, setMessage] = useState(insight.message);
  const [updating, setUpdating] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    await insightsStore.updateMessage(insight.id, message);
    setUpdating(false);
    onFinish();
  };

  return (
    <form onSubmit={onSubmit} className=" flex gap-2 w-full">
      {updating && <Spinner />}
      <Input
        className="w-full rounded"
        value={message}
        disabled={updating}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" disabled={updating} variant="default">
        Save
      </Button>
      <Button type="button" onClick={onFinish} variant="outline">
        Cancel
      </Button>
    </form>
  );
};

const ChatInput = () => {
  const [value, setValue] = useState<string>("");
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submitting value", value);
    if (value.trim() === "") return;
    setValue("");
    await insightsStore.sendMessage(value);
  };

  return (
    <form className="relative w-full" onSubmit={onSubmit}>
      <Input
        className="w-full rounded-full border border-zinc-400 px-4 py-6"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What's up?"
      />
      <Button
        type="submit"
        className="absolute right-[0.5rem] top-[0.4rem] rounded-full 
      bg-zinc-800 p-2 text-white hover:bg-black z-10 cursor-pointer">
        <SendHorizonal />
      </Button>
    </form>
  );
};

export default ListInsightsPage;
