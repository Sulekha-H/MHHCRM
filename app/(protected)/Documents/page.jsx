import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  return (
    <div>
      <h1>Documents</h1>
      <DocumentsClient />
    </div>
  );
}
