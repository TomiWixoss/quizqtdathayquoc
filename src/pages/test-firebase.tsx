import { useState } from "react";
import { Page, Box } from "zmp-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { Flame, CheckCircle, XCircle, Loader2 } from "lucide-react";

type ConnectionStatus = "idle" | "loading" | "success" | "error";

function TestFirebasePage() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<unknown>(null);

  const testConnection = async () => {
    setStatus("loading");
    setMessage("Đang kết nối Firebase...");

    try {
      const querySnapshot = await getDocs(collection(db, "test"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStatus("success");
      setMessage(`Kết nối thành công! Tìm thấy ${docs.length} documents.`);
      setData(docs);
    } catch (error) {
      setStatus("error");
      const err = error as Error;
      setMessage(`Lỗi: ${err.message}`);
      setData(null);
    }
  };

  const insertTestData = async () => {
    setStatus("loading");
    setMessage("Đang thêm dữ liệu test...");

    try {
      const docRef = await addDoc(collection(db, "test"), {
        message: "Hello from Quiz App!",
        timestamp: serverTimestamp(),
        random: Math.random(),
      });
      setStatus("success");
      setMessage(`Thêm dữ liệu thành công! ID: ${docRef.id}`);
      setData({ id: docRef.id });
    } catch (error) {
      setStatus("error");
      const err = error as Error;
      setMessage(`Lỗi: ${err.message}`);
    }
  };

  return (
    <Page className="bg-background p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Test Firebase Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={status === "loading"}>
              {status === "loading" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Test Connection
            </Button>
            <Button
              variant="outline"
              onClick={insertTestData}
              disabled={status === "loading"}
            >
              Insert Test Data
            </Button>
          </div>

          {status !== "idle" && (
            <Box className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                {status === "loading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
                {status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {status === "error" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span
                  className={
                    status === "success"
                      ? "text-green-600"
                      : status === "error"
                      ? "text-red-600"
                      : ""
                  }
                >
                  {message}
                </span>
              </div>

              {data !== null && (
                <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </Box>
          )}

          <Box className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4 text-sm">
            <p className="font-medium text-orange-800 dark:text-orange-200 mb-2">
              🔥 Firebase Firestore đã được cấu hình!
            </p>
            <p className="text-orange-700 dark:text-orange-300">
              Nhớ bật Firestore trong Firebase Console và set rules cho phép
              read/write.
            </p>
          </Box>
        </CardContent>
      </Card>
    </Page>
  );
}

export default TestFirebasePage;
