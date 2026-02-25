import { BookTextIcon } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center justify-center">
      <BookTextIcon className="mr-1 text-primary" />
      <h1 className="text-xl font-bold text-primary">Bookle</h1>
    </div>
  );
}
