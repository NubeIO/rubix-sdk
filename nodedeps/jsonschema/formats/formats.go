package formats

import "github.com/NubeIO/rubix/internal/libs/jsonschema/schema"

// Common format patterns that can be used for custom validations

// UsernamePattern - 3-20 characters, alphanumeric and underscore only
const UsernamePattern = `^[a-zA-Z0-9_]{3,20}$`

// Username creates a username validation schema
func Username() *schema.Schema {
	return schema.String().
		Pattern(UsernamePattern).
		MinLength(3).
		MaxLength(20).
		Title("Username").
		Description("3-20 characters, letters, numbers, and underscore only").
		Build()
}

// Semver creates a semantic version validation schema
func Semver() *schema.Schema {
	return schema.String().
		Pattern(`^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$`).
		Title("Semantic Version").
		Description("Valid semantic version (e.g., 1.2.3, 2.0.0-beta.1)").
		Examples("1.0.0", "2.1.3", "1.0.0-alpha", "1.0.0-beta.2+build.123").
		Build()
}

// MacAddress creates a MAC address validation schema
func MacAddress() *schema.Schema {
	return schema.String().
		Pattern(`^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`).
		Title("MAC Address").
		Description("Valid MAC address (e.g., 00:1B:44:11:3A:B7)").
		Build()
}

// CIDRNotation creates a CIDR notation validation schema
func CIDRNotation() *schema.Schema {
	return schema.String().
		Pattern(`^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$`).
		Title("CIDR Notation").
		Description("Network address in CIDR notation (e.g., 192.168.1.0/24)").
		Build()
}

// Base64 creates a base64 string validation schema
func Base64() *schema.Schema {
	return schema.String().
		Pattern(`^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$`).
		Title("Base64").
		Description("Base64 encoded string").
		Build()
}

// JWT creates a JWT token validation schema
func JWT() *schema.Schema {
	return schema.String().
		Pattern(`^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$`).
		Title("JWT Token").
		Description("JSON Web Token").
		Build()
}

// Markdown creates a markdown text field schema
func Markdown() *schema.Schema {
	return schema.String().
		Title("Markdown").
		Description("Markdown formatted text").
		UIWidget("textarea").
		UIOptions(map[string]interface{}{
			"rows": 10,
		}).
		Build()
}

// JSON creates a JSON string validation schema
func JSON() *schema.Schema {
	return schema.String().
		Title("JSON").
		Description("Valid JSON string").
		UIWidget("textarea").
		UIOptions(map[string]interface{}{
			"rows":        8,
			"placeholder": "{ }",
		}).
		Build()
}

// Code creates a code field schema
func Code(language string) *schema.Schema {
	return schema.String().
		Title("Code").
		Description("Code snippet").
		UIWidget("textarea").
		UIOptions(map[string]interface{}{
			"rows":     15,
			"language": language,
		}).
		Build()
}

// CountryCode2 creates a 2-letter country code validation schema (ISO 3166-1 alpha-2)
func CountryCode2() *schema.Schema {
	return schema.String().
		Pattern(`^[A-Z]{2}$`).
		MinLength(2).
		MaxLength(2).
		Title("Country Code").
		Description("ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)").
		Examples("US", "GB", "DE", "FR", "JP").
		Build()
}

// CountryCode3 creates a 3-letter country code validation schema (ISO 3166-1 alpha-3)
func CountryCode3() *schema.Schema {
	return schema.String().
		Pattern(`^[A-Z]{3}$`).
		MinLength(3).
		MaxLength(3).
		Title("Country Code").
		Description("ISO 3166-1 alpha-3 country code (e.g., USA, GBR, DEU)").
		Examples("USA", "GBR", "DEU", "FRA", "JPN").
		Build()
}

// CurrencyCode creates a currency code validation schema (ISO 4217)
func CurrencyCode() *schema.Schema {
	return schema.String().
		Pattern(`^[A-Z]{3}$`).
		MinLength(3).
		MaxLength(3).
		Title("Currency Code").
		Description("ISO 4217 currency code (e.g., USD, EUR, GBP)").
		Examples("USD", "EUR", "GBP", "JPY", "CNY").
		Build()
}

// LanguageCode creates a language code validation schema (ISO 639-1)
func LanguageCode() *schema.Schema {
	return schema.String().
		Pattern(`^[a-z]{2}$`).
		MinLength(2).
		MaxLength(2).
		Title("Language Code").
		Description("ISO 639-1 language code (e.g., en, es, fr)").
		Examples("en", "es", "fr", "de", "ja").
		Build()
}

// Timezone creates a timezone validation schema
func Timezone() *schema.Schema {
	return schema.String().
		Pattern(`^[A-Za-z_]+\/[A-Za-z_]+$`).
		Title("Timezone").
		Description("IANA timezone (e.g., America/New_York, Europe/London)").
		Examples("America/New_York", "Europe/London", "Asia/Tokyo", "UTC").
		Build()
}

// Duration creates a duration validation schema (ISO 8601)
func Duration() *schema.Schema {
	return schema.String().
		Pattern(`^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$`).
		Title("Duration").
		Description("ISO 8601 duration (e.g., P1Y2M3DT4H5M6S)").
		Examples("PT30M", "P1D", "P1Y2M3DT4H5M6S").
		Build()
}

// MIMEType creates a MIME type validation schema
func MIMEType() *schema.Schema {
	return schema.String().
		Pattern(`^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_+.]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_+.]*$`).
		Title("MIME Type").
		Description("Valid MIME type (e.g., application/json, text/html)").
		Examples("application/json", "text/html", "image/png").
		Build()
}

// FilePath creates a file path validation schema
func FilePath() *schema.Schema {
	return schema.String().
		Pattern(`^[^<>:"|?*]+$`).
		Title("File Path").
		Description("Valid file path").
		Build()
}

// UnixPath creates a Unix file path validation schema
func UnixPath() *schema.Schema {
	return schema.String().
		Pattern(`^\/(?:[^\/\0]+\/?)*$`).
		Title("Unix Path").
		Description("Valid Unix file path (e.g., /usr/local/bin)").
		Examples("/usr/local/bin", "/etc/config", "/var/log/app.log").
		Build()
}

// WindowsPath creates a Windows file path validation schema
func WindowsPath() *schema.Schema {
	return schema.String().
		Pattern(`^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$`).
		Title("Windows Path").
		Description("Valid Windows file path (e.g., C:\\Program Files\\App)").
		Examples("C:\\Windows", "D:\\Documents", "C:\\Program Files\\App\\file.txt").
		Build()
}

// Latitude creates a latitude validation schema
func Latitude() *schema.Schema {
	return schema.Number().
		Minimum(-90).
		Maximum(90).
		Title("Latitude").
		Description("Geographic latitude (-90 to 90)").
		Build()
}

// Longitude creates a longitude validation schema
func Longitude() *schema.Schema {
	return schema.Number().
		Minimum(-180).
		Maximum(180).
		Title("Longitude").
		Description("Geographic longitude (-180 to 180)").
		Build()
}

// Coordinate creates a geographic coordinate schema (latitude and longitude)
func Coordinate() *schema.Schema {
	return schema.Object().
		Title("Geographic Coordinate").
		Property("latitude", Latitude()).
		Property("longitude", Longitude()).
		Required("latitude", "longitude").
		Build()
}

// Percentage creates a percentage validation schema (0-100)
func Percentage() *schema.Schema {
	return schema.Number().
		Minimum(0).
		Maximum(100).
		Title("Percentage").
		Description("Percentage value (0-100)").
		Build()
}

// PercentageDecimal creates a percentage validation schema as decimal (0-1)
func PercentageDecimal() *schema.Schema {
	return schema.Number().
		Minimum(0).
		Maximum(1).
		Title("Percentage").
		Description("Percentage as decimal (0-1)").
		Build()
}
