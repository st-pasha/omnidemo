import { SendHorizonal } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { insightsStore } from "~/state/insightsStore";

//
const ListInsightsPage = observer(() => {
  const insights = insightsStore.insights;

  return (
    <div className="h-full flex flex-col ">
      <div className="grow">
        <div className="flex flex-col gap-4 overflow-y-auto pt-4">
          {insights.map((insight) => (
            <div
              key={insight.created_at}
              className="flex items-center gap-2 border border-transparent 
                px-2 rounded-lg py-1
                hover:border-stone-300 hover:shadow cursor-pointer">
              <Avatar className="-mt-1">
                <AvatarFallback>{insight.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{insight.username}</span>
                <span className="text-sm text-zinc-600">{insight.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <ChatInput />
      </div>
    </div>
  );
});

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
        className="w-full rounded-xl border border-zinc-400 px-4 py-6"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What's up?"
      />
      <Button
        type="submit"
        className="absolute right-4 inset-y-1 rounded-full 
      bg-zinc-800 p-2 text-white hover:bg-black z-10 cursor-pointer">
        <SendHorizonal />
      </Button>
    </form>
  );
};

export default ListInsightsPage;
