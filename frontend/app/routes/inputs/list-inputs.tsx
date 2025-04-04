import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Spinner } from "~/components/custom/spinner";
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
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { api } from "~/lib/api";
import { datetimeToHumanString } from "~/lib/date-utils";
import { inputsStore, type FileInProgress, type TInput } from "~/state/inputs-store";

const ListInputsPage = observer(() => {
  const inputs = inputsStore.inputs;
  const files = new Set(inputs.map((input) => input.file_name));
  const filesInProgress = inputsStore.filesInProgress;

  return (
    <div>
      <div className="flex items-center mb-2 ">
        <h1 className="text-xl font-bold grow">Files</h1>
        <UploadFileButton />
      </div>
      <div>
        {inputsStore.loading ? (
          <Spinner />
        ) : files.size === 0 ? (
          <p>No files uploaded</p>
        ) : (
          <div>
            {Array.from(files).map((file) => (
              <FileEntry
                key={file}
                fileName={file}
                inputs={inputs.filter((input) => input.file_name === file)}
              />
            ))}
          </div>
        )}
        <div>
          {filesInProgress.map((file, i) => (
            <FileInProgressEntry key={i} fip={file} />
          ))}
        </div>
      </div>
    </div>
  );
});

const FileEntry = ({ fileName, inputs }: { fileName: string; inputs: TInput[] }) => {
  const [open, setOpen] = useState(false);
  const last = inputs[inputs.length - 1];
  const date = new Date(last.created_at);

  return (
    <div className="border rounded-lg px-4 py-2">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="font-semibold">{fileName}</div>
          <div>
            {inputs.length} version{inputs.length > 1 && "s"}
          </div>
        </div>
        <div>
          <div className="ml-6 text-sm text-zinc-500">
            Last version from{" "}
            <span className="font-semibold">{datetimeToHumanString(date)}</span> by user{" "}
            <span className="font-semibold">{last.username}</span>
          </div>
        </div>
      </div>
      {open && <Separator className="my-2 w-full" orientation="horizontal" />}
      {open && (
        <table>
          <thead>
            <tr>
              <th className="text-left text-sm font-semibold">File id</th>
              <th className="text-left text-sm font-semibold">User</th>
              <th className="text-left text-sm font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {inputs.map((input) => {
              const url = api.makeUrl("/inputs/download-file", {
                id: input.id,
              });
              return (
                <tr key={input.id}>
                  <td className="text-sm text-zinc-500 pr-4 font-mono">
                    <a href={url} className="hover:underline hover:text-black">
                      {input.id}
                    </a>
                  </td>
                  <td className="text-sm text-zinc-500 pr-4">{input.username}</td>
                  <td className="text-sm text-zinc-500 pr-4">
                    {datetimeToHumanString(new Date(input.created_at))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

const FileInProgressEntry = observer(({ fip }: { fip: FileInProgress }) => {
  return (
    <div className="border border-dashed rounded-lg px-4 py-2 flex mt-2">
      <div className="file-semibold">{fip.fileName}</div>
      <Spinner />
      <Progress value={fip.progress} className="w-64" />
    </div>
  );
});

const UploadFileButton = () => {
  const [open, setOpen] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file") as File;
    if (!file) return;
    inputsStore.uploadFile(file);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Upload file</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
          <DialogDescription>
            Select a CSV file that you want to upload.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="flex items-center space-x-2 mb-2">
            <Input type="file" name="file" />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="submit" className="cursor-pointer">
              Upload
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="cursor-pointer">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ListInputsPage;
