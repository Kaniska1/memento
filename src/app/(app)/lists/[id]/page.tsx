import { PublicListClient } from "@/components/lists/public-list-client";

type ListPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListPage({
  params,
}: ListPageProps) {
  const { id } = await params;

  return (
    <PublicListClient
      listId={id}
    />
  );
}