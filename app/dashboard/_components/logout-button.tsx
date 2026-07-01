import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={async () => {
      "use server";
      await signOut({ redirectTo: '/login' });
    }}>
      <Button variant="outline" type="submit">
        Sign Out
      </Button>
    </form>
  );
}