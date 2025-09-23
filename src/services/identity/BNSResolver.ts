import { StacksNetwork } from '@stacks/transactions';

/**
 * BNS Resolver service for interacting with Stacks BNS contracts
 * Requirement 1.1: Verify BNS name ownership on Stacks blockchain
 * Requirement 1.2: Create unique patient profile linked to BNS name
 */

export interface BNSNameInfo {
  name: string;
  namespace: string;
  owner: string;
  zonefile: string;
  address: string;
  blockHeight: number;
  expireBlock?: number;
}

export interface IBNSResolver {
  /**
   * Verify that a BNS name exists and get its ownership information
   * @param bnsName - The BNS name to verify (e.g., "john.btc")
   * @returns Promise resolving to BNS name information or null if not found
   */
  verifyBNSName(bnsName: string): Promise<BNSNameInfo | null>;

  /**
   * Check if a specific principal owns a BNS name
   * @param bnsName - The BNS name to check
   * @param principal - The Stacks principal to verify ownership
   * @returns Promise resolving to true if the principal owns the name
   */
  verifyOwnership(bnsName: string, principal: string): Promise<boolean>;

  /**
   * Get the current owner of a BNS name
   * @param bnsName - The BNS name to lookup
   * @returns Promise resolving to the owner's principal or null if not found
   */
  getOwner(bnsName: string): Promise<string | null>;
}

export class BNSResolver implements IBNSResolver {
  private network: StacksNetwork;
  private apiUrl: string;

  constructor(network?: StacksNetwork) {
    // Default to testnet configuration
    this.network = network || {
      version: 0x80,
      chainId: 0x80000000,
      coreApiUrl: 'https://api.testnet.hiro.so',
      broadcastEndpoint: '/v2/transactions',
      transferFeeEstimateEndpoint: '/v2/fees/transfer',
      accountEndpoint: '/v2/accounts',
      contractAbiEndpoint: '/v2/contracts/interface',
      readOnlyFunctionCallEndpoint: '/v2/contracts/call-read',
      isMainnet: () => false
    } as StacksNetwork;
    this.apiUrl = this.network.coreApiUrl;
  }

  async verifyBNSName(bnsName: string): Promise<BNSNameInfo | null> {
    try {
      const [name, namespace] = this.parseBNSName(bnsName);
      
      const response = await fetch(
        `${this.apiUrl}/v1/names/${name}.${namespace}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Name not found
        }
        throw new Error(`BNS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        name: data.name,
        namespace: data.namespace,
        owner: data.address,
        zonefile: data.zonefile,
        address: data.address,
        blockHeight: data.last_txid_height || 0,
        expireBlock: data.expire_block
      };
    } catch (error) {
      console.error('Error verifying BNS name:', error);
      throw new Error(`Failed to verify BNS name ${bnsName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyOwnership(bnsName: string, principal: string): Promise<boolean> {
    try {
      const nameInfo = await this.verifyBNSName(bnsName);
      if (!nameInfo) {
        return false;
      }
      
      return nameInfo.owner === principal;
    } catch (error) {
      console.error('Error verifying ownership:', error);
      return false;
    }
  }

  async getOwner(bnsName: string): Promise<string | null> {
    try {
      const nameInfo = await this.verifyBNSName(bnsName);
      return nameInfo?.owner || null;
    } catch (error) {
      console.error('Error getting owner:', error);
      return null;
    }
  }

  /**
   * Parse a BNS name into name and namespace components
   * @param bnsName - Full BNS name (e.g., "john.btc")
   * @returns Tuple of [name, namespace]
   */
  private parseBNSName(bnsName: string): [string, string] {
    const parts = bnsName.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid BNS name format: ${bnsName}. Expected format: name.namespace`);
    }
    return [parts[0], parts[1]];
  }
}