import { FileHelper, CSSHelper } from "@supernovaio/export-helpers";
import { OutputTextFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters";
import { exportConfiguration } from "..";
import { convertedToken } from "../content/token";

export function stringOutputFile(
  type: TokenType,
  tokens: Array<Token>,
  tokenGroups: Array<TokenGroup>,
): OutputTextFile | null {
  // Filter tokens by top level type
  const tokensOfType = tokens.filter((token) => token.tokenType === type);

  // Filter out files where there are no tokens, if enabled
  if (!exportConfiguration.generateEmptyFiles && tokensOfType.length === 0) {
    return null;
  }

  // Convert all tokens to CSS variables
  const mappedTokens = new Map(tokens.map((token) => [token.id, token]));

  // console.log("🚀 ~ tokenGroups:", tokenGroups);
  const cssVariables = tokensOfType
    .map((token) => {
      // console.log("🚀 ~ .map ~ token:", token);
      return convertedToken(token, mappedTokens, tokenGroups);
    })
    .join("\n");

  // Create file content
  let content = `:root {\n${cssVariables}\n}`;
  if (exportConfiguration.showGeneratedFileDisclaimer) {
    // Add disclaimer to every file if enabled
    content = `/* ${exportConfiguration.disclaimer} */\n${content}`;
  }

  // Retrieve content as file which content will be directly written to the output
  return FileHelper.createTextFile({
    relativePath: exportConfiguration.baseStyleFilePath,
    fileName: exportConfiguration.styleFileNames[type],
    content: content,
  });
}
