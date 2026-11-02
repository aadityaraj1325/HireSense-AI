import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle, CardDescription, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadDropzone } from "@/components/resume/UploadDropzone";
import { ResumeRow } from "@/components/resume/ResumeRow";
import { AllCVVersionsView } from "@/components/resume/AllCVVersionsView";
import { useResumesList } from "@/hooks/useResumes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

export default function Resumes() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "versions" ? "versions" : "resumes";
  const { data: resumes, isLoading } = useResumesList();

  function handleTabChange(tab) {
    if (tab === "versions") {
      setSearchParams({ tab: "versions" });
    } else {
      setSearchParams({});
    }
  }

  function handleUploaded(resume, setup) {
    nav(`/resumes/${resume._id}`, { state: setup });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Resumes & CVs"
        description="Upload, organize, tailor, and track versions across all your professional CVs."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="resumes" className="gap-2">
            <FileText size={14} /> My Resumes ({resumes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-2">
            <Layers size={14} /> All CV Versions
          </TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="resumes">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5">
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle className="text-base">Upload a resume</CardTitle>
                      <CardDescription className="mt-1">
                        PDF only. We extract the text and create version V1.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <UploadDropzone onUploaded={handleUploaded} />
                </Card>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {isLoading && (
                  <>
                    <Skeleton className="h-[88px] rounded-2xl" />
                    <Skeleton className="h-[88px] rounded-2xl" />
                    <Skeleton className="h-[88px] rounded-2xl" />
                  </>
                )}

                {!isLoading && resumes?.length === 0 && (
                  <EmptyState
                    icon={FileText}
                    title="No resumes yet"
                    description="Drop your first PDF on the left to get started — we'll parse it, score it, and suggest stronger bullets."
                  />
                )}

                {!isLoading &&
                  resumes?.map((r) => <ResumeRow key={r._id} resume={r} />)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions">
            <AllCVVersionsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
