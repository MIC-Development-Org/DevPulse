import { TrackDetailSchema, ModuleDetailSchema } from "@devpulse/contracts";
import { backendFetchJson, withNotFound } from "@/lib/bff";
import { ModuleReaderClient } from "./reader-client";

export default async function ModuleReaderPage({
  params,
}: {
  params: { track: string; module: string };
}) {
  // Phase 4: real DB-backed content straight from Express (server-to-server).
  // Unknown slugs render the 404 page via withNotFound. Both requests are
  // independent, so they run in parallel.
  const [track, moduleData] = await Promise.all([
    withNotFound(
      backendFetchJson(
        `/tracks/${encodeURIComponent(params.track)}`,
        TrackDetailSchema
      )
    ),
    withNotFound(
      backendFetchJson(
        `/tracks/${encodeURIComponent(params.track)}/modules/${encodeURIComponent(params.module)}`,
        ModuleDetailSchema
      )
    ),
  ]);

  // Find previous and next modules
  const currentIdx = track.modules.findIndex((m) => m.id === moduleData.id);
  const prevModule = currentIdx > 0 ? track.modules[currentIdx - 1] : null;
  const nextModule =
    currentIdx < track.modules.length - 1
      ? track.modules[currentIdx + 1]
      : null;

  return (
    <ModuleReaderClient
      track={track}
      moduleData={moduleData}
      prevModule={prevModule}
      nextModule={nextModule}
    />
  );
}

