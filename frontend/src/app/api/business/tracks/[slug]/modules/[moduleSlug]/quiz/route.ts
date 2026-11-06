import { PublicQuizQuestionListSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse } from "@/lib/bff";

/**
 * GET /api/business/tracks/:trackSlug/modules/:moduleSlug/quiz — public quiz
 * questions only (Phase 4). The shared contract omits correctOptionIndex AND
 * explanation; the payload is re-validated here against that contract before
 * it is handed to the browser, so grading truth can never transit this route
 * even if an upstream regression occurred.
 */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string; moduleSlug: string } }
) {
  const path =
    `/tracks/${encodeURIComponent(params.slug)}` +
    `/modules/${encodeURIComponent(params.moduleSlug)}/quiz`;
  const response = await authedBackendFetch(path);
  const result = await jsonBackendResponse(response, {
    schema: PublicQuizQuestionListSchema,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
