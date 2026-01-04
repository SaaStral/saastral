/**
 * Service Account Credentials Value Object
 *
 * Immutable value object representing Google Service Account credentials.
 * Used for Domain-Wide Delegation authentication with Google Workspace API.
 *
 * @see https://cloud.google.com/iam/docs/service-accounts
 */

export interface ServiceAccountKeyFile {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

export class ServiceAccountCredentials {
  private constructor(
    public readonly clientEmail: string,
    public readonly privateKey: string,
    public readonly clientId: string,
    public readonly projectId: string,
    public readonly privateKeyId: string,
  ) {
    // Ensure immutability
    Object.freeze(this)
  }

  /**
   * Create from Google Cloud Console JSON key file
   */
  static fromJSON(keyFileContent: string): ServiceAccountCredentials {
    try {
      const parsed = JSON.parse(keyFileContent) as ServiceAccountKeyFile

      if (parsed.type !== 'service_account') {
        throw new Error(
          'Invalid key file: type must be "service_account"',
        )
      }

      if (!parsed.client_email) {
        throw new Error('Invalid key file: missing client_email')
      }

      if (!parsed.private_key) {
        throw new Error('Invalid key file: missing private_key')
      }

      if (!parsed.client_id) {
        throw new Error('Invalid key file: missing client_id')
      }

      if (!parsed.project_id) {
        throw new Error('Invalid key file: missing project_id')
      }

      if (!parsed.private_key_id) {
        throw new Error('Invalid key file: missing private_key_id')
      }

      return new ServiceAccountCredentials(
        parsed.client_email,
        parsed.private_key,
        parsed.client_id,
        parsed.project_id,
        parsed.private_key_id,
      )
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON in key file')
      }
      throw error
    }
  }

  /**
   * Create from individual properties
   */
  static create(props: {
    clientEmail: string
    privateKey: string
    clientId: string
    projectId: string
    privateKeyId: string
  }): ServiceAccountCredentials {
    return new ServiceAccountCredentials(
      props.clientEmail,
      props.privateKey,
      props.clientId,
      props.projectId,
      props.privateKeyId,
    )
  }

  /**
   * Validate that all required fields are present
   */
  isValid(): boolean {
    return !!(
      this.clientEmail &&
      this.privateKey &&
      this.clientId &&
      this.projectId &&
      this.privateKeyId
    )
  }

  /**
   * Convert to JSON representation (for storage)
   * Note: The private key will be encrypted before storage by the repository
   */
  toJSON(): {
    clientEmail: string
    privateKey: string
    clientId: string
    projectId: string
    privateKeyId: string
  } {
    return {
      clientEmail: this.clientEmail,
      privateKey: this.privateKey,
      clientId: this.clientId,
      projectId: this.projectId,
      privateKeyId: this.privateKeyId,
    }
  }

  /**
   * Reconstruct full key file format (useful for Google APIs)
   */
  toKeyFile(): ServiceAccountKeyFile {
    return {
      type: 'service_account',
      project_id: this.projectId,
      private_key_id: this.privateKeyId,
      private_key: this.privateKey,
      client_email: this.clientEmail,
      client_id: this.clientId,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url:
        'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(this.clientEmail)}`,
    }
  }

  /**
   * Value objects are compared by value, not identity
   */
  equals(other: ServiceAccountCredentials): boolean {
    return (
      this.clientEmail === other.clientEmail &&
      this.privateKey === other.privateKey &&
      this.clientId === other.clientId &&
      this.projectId === other.projectId &&
      this.privateKeyId === other.privateKeyId
    )
  }
}
