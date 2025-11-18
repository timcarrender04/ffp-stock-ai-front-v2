"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Divider } from "@heroui/divider";

import { useAlert } from "@/lib/contexts/AlertContext";

interface AlpacaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlpacaSettingsModal({
  isOpen,
  onClose,
}: AlpacaSettingsModalProps) {
  const { confirm } = useAlert();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState<"paper" | "live" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Paper trading credentials
  const [paperApiKey, setPaperApiKey] = React.useState("");
  const [paperApiSecret, setPaperApiSecret] = React.useState("");
  const [paperConnected, setPaperConnected] = React.useState(false);
  const [paperAccountId, setPaperAccountId] = React.useState<string | null>(
    null,
  );

  // Live trading credentials
  const [liveApiKey, setLiveApiKey] = React.useState("");
  const [liveApiSecret, setLiveApiSecret] = React.useState("");
  const [liveConnected, setLiveConnected] = React.useState(false);
  const [liveAccountId, setLiveAccountId] = React.useState<string | null>(null);

  // Load existing credentials on open
  React.useEffect(() => {
    if (isOpen) {
      loadCredentials();
    } else {
      // Reset state on close
      setError(null);
      setSuccess(null);
      setPaperApiKey("");
      setPaperApiSecret("");
      setLiveApiKey("");
      setLiveApiSecret("");
    }
  }, [isOpen]);

  const loadCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/alpaca/credentials");

      if (!response.ok) {
        throw new Error("Failed to load credentials");
      }

      const data = await response.json();

      setPaperConnected(data.paper_connected || false);
      setLiveConnected(data.live_connected || false);
      setPaperAccountId(data.paper_account_id || null);
      setLiveAccountId(data.live_account_id || null);

      // Note: We don't load the actual keys for security
      // Users need to re-enter them if they want to update
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load credentials",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: {
        paper_api_key?: string;
        paper_api_secret?: string;
        live_api_key?: string;
        live_api_secret?: string;
      } = {};

      // Only include fields that have values
      if (paperApiKey && paperApiSecret) {
        body.paper_api_key = paperApiKey;
        body.paper_api_secret = paperApiSecret;
      }

      if (liveApiKey && liveApiSecret) {
        body.live_api_key = liveApiKey;
        body.live_api_secret = liveApiSecret;
      }

      // Validate that at least one pair is provided
      if (
        !body.paper_api_key &&
        !body.paper_api_secret &&
        !body.live_api_key &&
        !body.live_api_secret
      ) {
        setError("Please enter at least one set of API credentials");
        setIsSaving(false);

        return;
      }

      const response = await fetch("/api/alpaca/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to save credentials");
      }

      const result = await response.json();

      setSuccess("Credentials saved successfully!");
      setPaperApiKey("");
      setPaperApiSecret("");
      setLiveApiKey("");
      setLiveApiSecret("");

      // Reload to update connection status
      await loadCredentials();

      // Test connection if credentials were saved
      if (result.paper_connected) {
        await testConnection("paper");
      }
      if (result.live_connected) {
        await testConnection("live");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save credentials",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (mode: "paper" | "live") => {
    setIsTesting(mode);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/alpaca/account?mode=${mode}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to connect to Alpaca");
      }

      const account = await response.json();

      setSuccess(
        `✅ ${mode === "paper" ? "Paper" : "Live"} trading account connected! Account: ${account.account_number || "N/A"}`,
      );

      // Update account IDs in database
      try {
        const updateResponse = await fetch("/api/alpaca/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Send empty to just trigger account ID update
            update_account_id: true,
            mode,
            account_number: account.account_number,
          }),
        });

        if (updateResponse.ok) {
          // Update local state
          if (mode === "paper") {
            setPaperAccountId(account.account_number || null);
            setPaperConnected(true);
          } else {
            setLiveAccountId(account.account_number || null);
            setLiveConnected(true);
          }
        }
      } catch (updateErr) {
        // Non-critical error, just log it
        // eslint-disable-next-line no-console
        console.warn("Failed to update account ID:", updateErr);
      }

      // Reload credentials to sync account IDs
      await loadCredentials();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to connect to ${mode} trading account`,
      );
      if (mode === "paper") {
        setPaperConnected(false);
      } else {
        setLiveConnected(false);
      }
    } finally {
      setIsTesting(null);
    }
  };

  const handleDelete = async (mode: "paper" | "live") => {
    const confirmed = await confirm(
      `Are you sure you want to delete your ${mode} trading credentials? This action cannot be undone.`,
      {
        title: "Delete Credentials",
        variant: "warning",
      },
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/alpaca/credentials?mode=${mode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.error || "Failed to delete credentials");
      }

      setSuccess(
        `${mode === "paper" ? "Paper" : "Live"} trading credentials deleted`,
      );
      await loadCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete credentials",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      classNames={{
        base: "bg-finance-surface-70",
        header: "border-b border-finance-green-30",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon
                  className="text-2xl text-finance-green"
                  icon="solar:chart-2-bold"
                />
                <h2 className="text-xl font-semibold text-white">
                  Alpaca Integration
                </h2>
              </div>
              <p className="text-sm text-zinc-400">
                Connect your Alpaca account to enable trading features
              </p>
            </ModalHeader>
            <ModalBody className="py-6">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner color="success" size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                      <div className="flex items-center gap-2 text-red-300">
                        <Icon
                          className="text-lg"
                          icon="solar:danger-triangle-bold"
                        />
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                      <div className="flex items-center gap-2 text-green-300">
                        <Icon
                          className="text-lg"
                          icon="solar:check-circle-bold"
                        />
                        <p className="text-sm font-medium">{success}</p>
                      </div>
                    </div>
                  )}

                  {/* Connection Status Table */}
                  <div className="rounded-lg border border-finance-green-20 bg-finance-surface-60 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Connection Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b border-finance-green-20/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300">
                            Paper Trading
                          </span>
                          {paperConnected ? (
                            <Chip color="success" size="sm" variant="flat">
                              Connected
                            </Chip>
                          ) : (
                            <Chip color="default" size="sm" variant="flat">
                              Not Connected
                            </Chip>
                          )}
                        </div>
                        {paperAccountId && (
                          <span className="text-xs text-zinc-400">
                            Account: {paperAccountId}
                          </span>
                        )}
                        {paperConnected && (
                          <Button
                            className="text-xs"
                            isDisabled={isTesting === "paper"}
                            isLoading={isTesting === "paper"}
                            size="sm"
                            variant="flat"
                            onPress={() => testConnection("paper")}
                          >
                            <Icon
                              className="text-sm"
                              icon="solar:refresh-bold"
                            />
                            Test
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300">
                            Live Trading
                          </span>
                          {liveConnected ? (
                            <Chip color="danger" size="sm" variant="flat">
                              Connected
                            </Chip>
                          ) : (
                            <Chip color="default" size="sm" variant="flat">
                              Not Connected
                            </Chip>
                          )}
                        </div>
                        {liveAccountId && (
                          <span className="text-xs text-zinc-400">
                            Account: {liveAccountId}
                          </span>
                        )}
                        {liveConnected && (
                          <Button
                            className="text-xs"
                            isDisabled={isTesting === "live"}
                            isLoading={isTesting === "live"}
                            size="sm"
                            variant="flat"
                            onPress={() => testConnection("live")}
                          >
                            <Icon
                              className="text-sm"
                              icon="solar:refresh-bold"
                            />
                            Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Paper Trading Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          Paper Trading
                        </h3>
                        {paperConnected && (
                          <Chip
                            className="text-xs"
                            color="success"
                            size="sm"
                            variant="flat"
                          >
                            Connected
                          </Chip>
                        )}
                      </div>
                      {paperConnected && (
                        <Button
                          color="danger"
                          isDisabled={isSaving}
                          size="sm"
                          variant="flat"
                          onPress={() => handleDelete("paper")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Use paper trading to practice without real money. Get your
                      API keys from{" "}
                      <a
                        className="text-finance-green hover:underline"
                        href="https://app.alpaca.markets/paper/dashboard/overview"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Alpaca Paper Trading
                      </a>
                      .
                    </p>
                    <div className="space-y-3">
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-zinc-300",
                        }}
                        isDisabled={isSaving}
                        label="API Key"
                        placeholder="Enter paper trading API key"
                        type="text"
                        value={paperApiKey}
                        onValueChange={setPaperApiKey}
                      />
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-zinc-300",
                        }}
                        isDisabled={isSaving}
                        label="API Secret"
                        placeholder="Enter paper trading API secret"
                        type="password"
                        value={paperApiSecret}
                        onValueChange={setPaperApiSecret}
                      />
                    </div>
                    {paperApiKey && paperApiSecret && !paperConnected && (
                      <Button
                        className="w-full"
                        color="success"
                        isDisabled={isSaving || isTesting !== null}
                        isLoading={isTesting === "paper"}
                        size="sm"
                        variant="flat"
                        onPress={() => testConnection("paper")}
                      >
                        <Icon
                          className="text-base"
                          icon="solar:check-circle-bold"
                        />
                        Test Connection
                      </Button>
                    )}
                  </div>

                  <Divider className="bg-finance-green-20" />

                  {/* Live Trading Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          Live Trading
                        </h3>
                        {liveConnected && (
                          <Chip
                            className="text-xs"
                            color="danger"
                            size="sm"
                            variant="flat"
                          >
                            Connected
                          </Chip>
                        )}
                      </div>
                      {liveConnected && (
                        <Button
                          color="danger"
                          isDisabled={isSaving}
                          size="sm"
                          variant="flat"
                          onPress={() => handleDelete("live")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <Icon
                          className="mt-0.5 text-lg text-yellow-400"
                          icon="solar:danger-triangle-bold"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-yellow-300">
                            Warning: Live Trading
                          </p>
                          <p className="mt-1 text-xs text-yellow-200/80">
                            Live trading uses real money. Only connect your live
                            account if you understand the risks. Get your API
                            keys from{" "}
                            <a
                              className="underline"
                              href="https://app.alpaca.markets/dashboard/overview"
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              Alpaca Dashboard
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-zinc-300",
                        }}
                        isDisabled={isSaving}
                        label="API Key"
                        placeholder="Enter live trading API key"
                        type="text"
                        value={liveApiKey}
                        onValueChange={setLiveApiKey}
                      />
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-zinc-300",
                        }}
                        isDisabled={isSaving}
                        label="API Secret"
                        placeholder="Enter live trading API secret"
                        type="password"
                        value={liveApiSecret}
                        onValueChange={setLiveApiSecret}
                      />
                    </div>
                    {liveApiKey && liveApiSecret && !liveConnected && (
                      <Button
                        className="w-full"
                        color="warning"
                        isDisabled={isSaving || isTesting !== null}
                        isLoading={isTesting === "live"}
                        size="sm"
                        variant="flat"
                        onPress={() => testConnection("live")}
                      >
                        <Icon
                          className="text-base"
                          icon="solar:danger-triangle-bold"
                        />
                        Test Live Connection
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="border-t border-finance-green-30">
              <Button
                className="text-zinc-300"
                isDisabled={isSaving}
                variant="light"
                onPress={onClose}
              >
                Close
              </Button>
              <Button
                className="bg-finance-green text-black font-semibold"
                color="success"
                isDisabled={isSaving || isLoading}
                isLoading={isSaving}
                onPress={handleSave}
              >
                {isSaving ? "Saving..." : "Save Credentials"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
