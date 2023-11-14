// import { useBosLoaderStore } from '@/stores/bos-loader';
import { useVmStore } from "@/stores/vm";

type Props = {
  src: string;
  props?: Record<string, unknown>;
};

export function VmComponent(props: Props) {
  const { Widget } = useVmStore();
  // const redirectMapStore = useBosLoaderStore();

  // if (!EthersProvider) {
  //   return <p>Loading...</p>;
  // }

  return (
    <Widget
      // config={{
      //   redirectMap: redirectMapStore.redirectMap,
      // }}
      {...props}
    />
  );
}
