import { openMiniApp } from "zmp-sdk";
import { useNavigate } from "zmp-ui";
import { Box, Page } from "zmp-ui";
import { LayoutGrid, Flame } from "lucide-react";

import Clock from "@/components/clock";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import bg from "@/static/bg.svg";

function HomePage() {
  const navigate = useNavigate();

  return (
    <Page
      className="flex flex-col items-center justify-center gap-6 bg-cover bg-center bg-no-repeat bg-background"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <Box />
      <Box className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Hello world!
        </h1>
        <Clock />
      </Box>
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => {
            openMiniApp({
              appId: "1070750904448149704", // ZaUI Components
            });
          }}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          ZaUI Component Library
        </Button>
        <Button variant="outline" onClick={() => navigate("/test-firebase")}>
          <Flame className="mr-2 h-4 w-4 text-orange-500" />
          Test Firebase
        </Button>
      </div>
      <Logo className="fixed bottom-8 text-muted-foreground" />
    </Page>
  );
}

export default HomePage;
