const { makePgTsGenerator } = require("kanel");
const { makeKyselyHook } = require("kanel-kysely");

/**
 * Our convention: _foo = table, foo = view (active records only).
 * Views are filtered from codegen to avoid duplicate default exports,
 * but Kysely queries reference view names. This hook adds view entries
 * to the AppSchema that point to the same table type.
 */
function addViewSchemaEntries(outputAcc) {
  for (const file of Object.values(outputAcc)) {
    const decls = file?.declarations ?? file;
    if (!Array.isArray(decls)) continue;
    for (const decl of decls) {
      if (decl.declarationType !== "interface" || decl.name !== "AppSchema")
        continue;
      const viewEntries = [];
      for (const prop of decl.properties || []) {
        if (prop.name.startsWith("_")) {
          viewEntries.push({ ...prop, name: prop.name.slice(1) });
        }
      }
      decl.properties.push(...viewEntries);
    }
  }
  return outputAcc;
}

/** @type {import('kanel').ConfigV4} */
module.exports = {
  connection: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  schemaNames: ["app", "auth"],
  outputPath: "./src/generated",
  preDeleteOutputFolder: true,

  filter: (pgType) => {
    if (pgType.schemaName === "auth") return pgType.name === "users";
    if (pgType.kind === "view") return false;
    return true;
  },

  typescriptConfig: {
    enumStyle: "literal-union",
    tsModuleFormat: "esm",
  },

  postRenderHooks: [
    (path, lines) =>
      lines.map((l) =>
        l.match(/^export default (\w+);$/)
          ? `export type { ${l.match(/^export default (\w+);$/)[1]} as default };`
          : l,
      ),
  ],

  generators: [
    makePgTsGenerator({
      filter: (pgType) =>
        pgType.kind !== "function" && pgType.kind !== "procedure",

      customTypeMap: {
        "pg_catalog.jsonb": {
          name: "JsonValue",
          typeImports: [
            {
              name: "JsonValue",
              isDefault: false,
              path: "../../jsonTypes",
              isAbsolute: true,
              importAsType: true,
            },
          ],
        },
        "pg_catalog.json": {
          name: "JsonValue",
          typeImports: [
            {
              name: "JsonValue",
              isDefault: false,
              path: "../../jsonTypes",
              isAbsolute: true,
              importAsType: true,
            },
          ],
        },
      },

      getPropertyMetadata: (property, details, generateFor, builtinMetadata) => {
        if (property.name === "role_config" && details.name === "_offices") {
          return {
            ...builtinMetadata,
            typeOverride: {
              name: "OfficeRoleConfig",
              typeImports: [
                {
                  name: "OfficeRoleConfig",
                  isDefault: false,
                  path: "../../officeRoleConfig",
                  isAbsolute: true,
                  importAsType: true,
                },
              ],
            },
          };
        }
        return builtinMetadata;
      },

      generateIdentifierType: (_column, _details, builtinType) => ({
        ...builtinType,
        typeDefinition: ["string"],
      }),

      preRenderHooks: [
        makeKyselyHook(),
        addViewSchemaEntries,
      ],
    }),
  ],
};
