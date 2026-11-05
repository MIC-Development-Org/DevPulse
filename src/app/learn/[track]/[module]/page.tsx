import { notFound } from "next/navigation";
import { api } from "@/lib/api/api-client";
import { ModuleReaderClient } from "./reader-client";

export default async function ModuleReaderPage({
  params,
}: {
  params: { track: string; module: string };
}) {
  const track = await api.getTrackBySlug(params.track);
  if (!track) notFound();

  const moduleData = await api.getModuleBySlug(params.track, params.module);
  if (!moduleData) notFound();

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

