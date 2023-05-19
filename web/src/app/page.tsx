import { MapBoxComponent } from "../components/Map";

async function readKafka() {
  const res = await fetch(process.env.KAFKA_URL as string, { headers: { Authorization: process.env.KAFKA_TOKEN as string,}})

  return res.json()
}

export default async function Page() {
  const data = await readKafka();
  return (
      <MapBoxComponent data={data} />
  );
}
