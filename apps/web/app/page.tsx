import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@chat-bot/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <h1 className="text-4xl font-bold">Component Library Test</h1>
      
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>Testing our new component library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Type something..." />
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
