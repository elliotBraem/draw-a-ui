import { sanitizeUrl } from "@braintree/sanitize-url";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import Big from "big.js";
import {
  CommitButton,
  EthersProviderContext,
  useAccount,
  useCache,
  useInitNear,
  useNear,
  utils,
  Widget,
} from "near-social-vm";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

// import { useEthersProviderContext } from '@/data/web3';
// import { useIdOS } from '@/hooks/useIdOS';
// import { useSignInRedirect } from '@/hooks/useSignInRedirect';
import { useAuthStore } from "@/stores/auth";
import { useVmStore } from "@/stores/vm";
// import { recordWalletConnect, reset as resetAnalytics } from '@/utils/analytics';
// import { networkId, signInContractId } from '@/utils/config';
// import { KEYPOM_OPTIONS } from '@/utils/keypom-options';

export default function VmInitializer() {
  const [signedIn, setSignedIn] = useState(false);
  const [signedAccountId, setSignedAccountId] = useState(null);
  const [availableStorage, setAvailableStorage] = useState<Big | null>(null);
  const [walletModal, setWalletModal] = useState<WalletSelectorModal | null>(
    null
  );
  // const ethersProviderContext = useEthersProviderContext();
  const { initNear } = useInitNear();
  const near = useNear();
  const account = useAccount();
  const cache = useCache();
  const accountId = account.accountId;
  const setAuthStore = useAuthStore((state) => state.set);
  const setVmStore = useVmStore((store) => store.set);
  // const { requestAuthentication, saveCurrentUrl } = useSignInRedirect();
  // const idOS = useIdOS();

  const networkId = "mainnet";
  useEffect(() => {
    initNear &&
      initNear({
        networkId,
        // walletConnectCallback: recordWalletConnect,
        selector: setupWalletSelector({
          network: networkId,
          modules: [setupNearWallet()],
        }),
        customElements: {
          Link: ({ href, to, ...rest }: any) => (
            <Link href={sanitizeUrl(href ?? to)} {...rest} />
          ),
        },
        features: { enableComponentSrcDataKey: true },
      });
  }, [initNear]);

  useEffect(() => {
    if (!near) {
      return;
    }
    near.selector.then((selector: any) => {
      const selectorModal = setupModal(selector, {
        contractId: near.config.contractName,
        // methodNames: idOS.near.contractMethods,
      });
      setWalletModal(selectorModal);
    });
  }, [near]);

  const requestSignMessage = useCallback(
    async (message: string) => {
      if (!near) {
        return;
      }
      const wallet = await (await near.selector).wallet();
      const nonce = Buffer.from(Array.from(Array(32).keys()));
      const recipient = "social.near";

      try {
        const signedMessage = await wallet.signMessage({
          message,
          nonce,
          recipient,
        });

        if (signedMessage) {
          const verifiedFullKeyBelongsToUser = await wallet.verifyOwner({
            message: signedMessage,
          });

          if (verifiedFullKeyBelongsToUser) {
            alert(
              `Successfully verify signed message: '${message}': \n ${JSON.stringify(
                signedMessage
              )}`
            );
          } else {
            alert(
              `Failed to verify signed message '${message}': \n ${JSON.stringify(
                signedMessage
              )}`
            );
          }
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Something went wrong";
        alert(errMsg);
      }
    },
    [near]
  );

  const requestSignInWithWallet = useCallback(() => {
    // saveCurrentUrl();
    walletModal?.show();
    return false;
  }, [walletModal]);

  const logOut = useCallback(async () => {
    if (!near) {
      return;
    }
    const wallet = await (await near.selector).wallet();
    wallet.signOut();
    near.accountId = null;
    setSignedIn(false);
    setSignedAccountId(null);
    // resetAnalytics();
    localStorage.removeItem("accountId");
  }, [near]);

  const refreshAllowance = useCallback(async () => {
    alert(
      "You're out of access key allowance. Need sign in again to refresh it"
    );
    await logOut();
  }, [logOut]);

  useEffect(() => {
    if (!near) {
      return;
    }
    setSignedIn(!!accountId);
    setSignedAccountId(accountId);
  }, [near, accountId]);

  useEffect(() => {
    setAvailableStorage(
      account.storageBalance
        ? Big(account.storageBalance.available).div(utils.StorageCostPerByte)
        : Big(0)
    );
  }, [account]);

  useEffect(() => {
    if (navigator.userAgent !== "ReactSnap") {
      const pageFlashPrevent = document.getElementById("page-flash-prevent");
      if (pageFlashPrevent) {
        pageFlashPrevent.remove();
      }
    }
  }, []);

  useEffect(() => {
    setAuthStore({
      account,
      accountId: signedAccountId || "",
      availableStorage,
      logOut,
      refreshAllowance,
      requestSignInWithWallet,
      requestSignMessage,
      vmNear: near,
      signedIn,
    });
  }, [
    account,
    availableStorage,
    logOut,
    refreshAllowance,
    requestSignInWithWallet,
    requestSignMessage,
    signedIn,
    signedAccountId,
    setAuthStore,
    near,
  ]);

  useEffect(() => {
    setVmStore({
      cache,
      CommitButton,
      // ethersContext: ethersProviderContext,
      // EthersProvider: EthersProviderContext.Provider,
      Widget,
      near,
    });
  }, [cache, setVmStore, near]);

  return <></>;
}
