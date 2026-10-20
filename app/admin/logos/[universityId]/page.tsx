import UniversityDataReview from "../../data/university-data-review";
export const dynamic = "force-dynamic";
export default async function UniversityLogoAdminPage({ params }: { params: Promise<{ universityId: string }> }) { const { universityId } = await params; return <UniversityDataReview initialView="logos" universityId={universityId}/>; }
