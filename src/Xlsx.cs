using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Xml.Linq;

namespace KulupTakip
{
    // Hücre stilleri (styles.xml içindeki cellXfs sırası)
    static class St
    {
        public const int Normal = 0, Text = 1, Header = 2, Title = 3, Money = 4, MoneyTotal = 5,
            Green = 6, Red = 7, Yellow = 8, BoldText = 9, Center = 10, Subtitle = 11, Gray = 12,
            Note = 13, BoldCenter = 14, MoneyGreen = 15, MoneyRed = 16, MoneyYellow = 17,
            BoldPlain = 18, CenterPlain = 19, MoneyHighlight = 20, BoldCenterPlain = 21, MoneyGray = 22;
    }

    class XCell { public object V; public int S; }

    class XSheet
    {
        public string Name;
        public Dictionary<long, XCell> Cells = new Dictionary<long, XCell>();
        public Dictionary<int, double> Widths = new Dictionary<int, double>();
        public Dictionary<int, double> Heights = new Dictionary<int, double>();
        public List<string> Merges = new List<string>();
        public bool Landscape;
        public int FreezeRows;
        public int MaxRow = -1, MaxCol = -1;

        public XSheet(string name) { Name = name; }

        public void Set(int r, int c, object v, int s)
        {
            Cells[(long)r * 20000 + c] = new XCell { V = v, S = s };
            if (r > MaxRow) MaxRow = r;
            if (c > MaxCol) MaxCol = c;
        }
        public void Set(int r, int c, object v) { Set(r, c, v, St.Normal); }

        public void Merge(int r1, int c1, int r2, int c2)
        {
            if (r1 == r2 && c1 == c2) return;
            Merges.Add(Xlsx.Ref(r1, c1) + ":" + Xlsx.Ref(r2, c2));
            // birleşik alanın tüm hücreleri için stil (kenarlık) tutarlı olsun
            XCell first;
            Cells.TryGetValue((long)r1 * 20000 + c1, out first);
            int s = first != null ? first.S : 0;
            for (int r = r1; r <= r2; r++)
                for (int c = c1; c <= c2; c++)
                    if (!(r == r1 && c == c1) && !Cells.ContainsKey((long)r * 20000 + c)) Set(r, c, null, s);
        }

        public void Width(int c, double w) { Widths[c] = w; }
    }

    static class Xlsx
    {
        const string NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
        const string RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

        public static string ColName(int c)
        {
            string s = "";
            c++;
            while (c > 0) { int m = (c - 1) % 26; s = (char)('A' + m) + s; c = (c - 1) / 26; }
            return s;
        }
        public static string Ref(int r, int c) { return ColName(c) + (r + 1).ToString(CultureInfo.InvariantCulture); }

        static string Esc(string s)
        {
            if (s == null) return "";
            var sb = new StringBuilder(s.Length + 8);
            foreach (char ch in s)
            {
                if (ch == '<') sb.Append("&lt;");
                else if (ch == '>') sb.Append("&gt;");
                else if (ch == '&') sb.Append("&amp;");
                else if (ch == '"') sb.Append("&quot;");
                else if (ch < 0x20 && ch != '\t' && ch != '\n' && ch != '\r') { }
                else sb.Append(ch);
            }
            return sb.ToString();
        }

        static string SafeSheetName(string n, HashSet<string> used)
        {
            foreach (char ch in new[] { '[', ']', ':', '*', '?', '/', '\\' }) n = n.Replace(ch, ' ');
            if (n.Length > 31) n = n.Substring(0, 31);
            if (n.Trim().Length == 0) n = "Sayfa";
            string b = n; int i = 2;
            while (used.Contains(n.ToLowerInvariant())) { string suf = " " + i++; n = (b.Length + suf.Length > 31 ? b.Substring(0, 31 - suf.Length) : b) + suf; }
            used.Add(n.ToLowerInvariant());
            return n;
        }

        static void Entry(ZipArchive z, string name, string content)
        {
            var e = z.CreateEntry(name, CompressionLevel.Optimal);
            using (var w = new StreamWriter(e.Open(), new UTF8Encoding(false))) w.Write(content);
        }

        public static void Write(string path, List<XSheet> sheets)
        {
            if (File.Exists(path)) File.Delete(path);
            using (var fs = new FileStream(path, FileMode.CreateNew))
            using (var z = new ZipArchive(fs, ZipArchiveMode.Create))
            {
                var ct = new StringBuilder();
                ct.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
                ct.Append("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">");
                ct.Append("<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>");
                ct.Append("<Default Extension=\"xml\" ContentType=\"application/xml\"/>");
                ct.Append("<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>");
                ct.Append("<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>");
                for (int i = 0; i < sheets.Count; i++)
                    ct.Append("<Override PartName=\"/xl/worksheets/sheet" + (i + 1) + ".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>");
                ct.Append("</Types>");
                Entry(z, "[Content_Types].xml", ct.ToString());

                Entry(z, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");

                var used = new HashSet<string>();
                var wb = new StringBuilder();
                wb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"" + NS + "\" xmlns:r=\"" + RNS + "\"><bookViews><workbookView/></bookViews><sheets>");
                var rels = new StringBuilder();
                rels.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
                for (int i = 0; i < sheets.Count; i++)
                {
                    wb.Append("<sheet name=\"" + Esc(SafeSheetName(sheets[i].Name, used)) + "\" sheetId=\"" + (i + 1) + "\" r:id=\"rId" + (i + 1) + "\"/>");
                    rels.Append("<Relationship Id=\"rId" + (i + 1) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet" + (i + 1) + ".xml\"/>");
                }
                wb.Append("</sheets></workbook>");
                rels.Append("<Relationship Id=\"rId" + (sheets.Count + 1) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>");
                rels.Append("</Relationships>");
                Entry(z, "xl/workbook.xml", wb.ToString());
                Entry(z, "xl/_rels/workbook.xml.rels", rels.ToString());
                Entry(z, "xl/styles.xml", Styles());
                for (int i = 0; i < sheets.Count; i++) Entry(z, "xl/worksheets/sheet" + (i + 1) + ".xml", SheetXml(sheets[i]));
            }
        }

        static string SheetXml(XSheet sh)
        {
            var ci = CultureInfo.InvariantCulture;
            var sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"" + NS + "\" xmlns:r=\"" + RNS + "\">");
            sb.Append("<sheetPr><pageSetUpPr fitToPage=\"1\"/></sheetPr>");
            sb.Append("<sheetViews><sheetView workbookViewId=\"0\">");
            if (sh.FreezeRows > 0)
                sb.Append("<pane ySplit=\"" + sh.FreezeRows + "\" topLeftCell=\"A" + (sh.FreezeRows + 1) + "\" activePane=\"bottomLeft\" state=\"frozen\"/>");
            sb.Append("</sheetView></sheetViews>");
            sb.Append("<sheetFormatPr defaultRowHeight=\"15\"/>");
            if (sh.Widths.Count > 0)
            {
                sb.Append("<cols>");
                foreach (var kv in sh.Widths.OrderBy(k => k.Key))
                    sb.Append("<col min=\"" + (kv.Key + 1) + "\" max=\"" + (kv.Key + 1) + "\" width=\"" + kv.Value.ToString(ci) + "\" customWidth=\"1\"/>");
                sb.Append("</cols>");
            }
            sb.Append("<sheetData>");
            var byRow = sh.Cells.GroupBy(k => (int)(k.Key / 20000)).OrderBy(g => g.Key);
            foreach (var g in byRow)
            {
                sb.Append("<row r=\"" + (g.Key + 1) + "\"");
                double h;
                if (sh.Heights.TryGetValue(g.Key, out h)) sb.Append(" ht=\"" + h.ToString(ci) + "\" customHeight=\"1\"");
                sb.Append(">");
                foreach (var kv in g.OrderBy(k => k.Key))
                {
                    int c = (int)(kv.Key % 20000);
                    string r = Ref(g.Key, c);
                    var cell = kv.Value;
                    string s = cell.S != 0 ? " s=\"" + cell.S + "\"" : "";
                    object v = cell.V;
                    if (v == null) sb.Append("<c r=\"" + r + "\"" + s + "/>");
                    else if (v is decimal || v is int || v is double || v is long)
                        sb.Append("<c r=\"" + r + "\"" + s + "><v>" + Convert.ToDecimal(v).ToString(ci) + "</v></c>");
                    else
                        sb.Append("<c r=\"" + r + "\"" + s + " t=\"inlineStr\"><is><t xml:space=\"preserve\">" + Esc(v.ToString()) + "</t></is></c>");
                }
                sb.Append("</row>");
            }
            sb.Append("</sheetData>");
            if (sh.Merges.Count > 0)
            {
                sb.Append("<mergeCells count=\"" + sh.Merges.Count + "\">");
                foreach (var m in sh.Merges) sb.Append("<mergeCell ref=\"" + m + "\"/>");
                sb.Append("</mergeCells>");
            }
            sb.Append("<pageMargins left=\"0.4\" right=\"0.4\" top=\"0.5\" bottom=\"0.5\" header=\"0.3\" footer=\"0.3\"/>");
            sb.Append("<pageSetup paperSize=\"9\" orientation=\"" + (sh.Landscape ? "landscape" : "portrait") + "\" fitToWidth=\"1\" fitToHeight=\"0\"/>");
            sb.Append("</worksheet>");
            return sb.ToString();
        }

        static string Styles()
        {
            // xf(font, fill, border, numFmt, yatay hizalama)
            var xfs = new[]
            {
                X(0,0,0,0,null),          // 0 Normal
                X(0,0,1,0,"left"),        // 1 Text
                X(1,2,1,0,"center"),      // 2 Header
                X(2,0,0,0,"center"),      // 3 Title
                X(0,0,1,164,null),        // 4 Money
                X(1,6,1,164,null),        // 5 MoneyTotal
                X(0,3,1,0,"center"),      // 6 Green
                X(0,4,1,0,"center"),      // 7 Red
                X(0,5,1,0,"center"),      // 8 Yellow
                X(1,6,1,0,"left"),        // 9 BoldText
                X(0,0,1,0,"center"),      // 10 Center
                X(4,0,0,0,"center"),      // 11 Subtitle
                X(0,6,1,0,"left"),        // 12 Gray
                X(3,0,0,0,"left"),        // 13 Note
                X(1,6,1,0,"center"),      // 14 BoldCenter
                X(0,3,1,164,null),        // 15 MoneyGreen
                X(0,4,1,164,null),        // 16 MoneyRed
                X(0,5,1,164,null),        // 17 MoneyYellow
                X(1,0,0,0,"left"),        // 18 BoldPlain
                X(0,0,0,0,"center"),      // 19 CenterPlain
                X(4,3,1,164,null),        // 20 MoneyHighlight
                X(1,0,0,0,"center"),      // 21 BoldCenterPlain
                X(0,6,1,164,null),        // 22 MoneyGray
            };
            var sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><styleSheet xmlns=\"" + NS + "\">");
            sb.Append("<numFmts count=\"1\"><numFmt numFmtId=\"164\" formatCode=\"#,##0.00\\ &quot;₺&quot;\"/></numFmts>");
            sb.Append("<fonts count=\"5\">");
            sb.Append("<font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>");
            sb.Append("<font><b/><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>");
            sb.Append("<font><b/><sz val=\"14\"/><name val=\"Calibri\"/><family val=\"2\"/></font>");
            sb.Append("<font><i/><sz val=\"9\"/><color rgb=\"FF595959\"/><name val=\"Calibri\"/><family val=\"2\"/></font>");
            sb.Append("<font><b/><sz val=\"12\"/><name val=\"Calibri\"/><family val=\"2\"/></font>");
            sb.Append("</fonts>");
            sb.Append("<fills count=\"7\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill>");
            foreach (var c in new[] { "FFD9E1F2", "FFC6EFCE", "FFFFC7CE", "FFFFEB9C", "FFEDEDED" })
                sb.Append("<fill><patternFill patternType=\"solid\"><fgColor rgb=\"" + c + "\"/><bgColor indexed=\"64\"/></patternFill></fill>");
            sb.Append("</fills>");
            sb.Append("<borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border>");
            sb.Append("<border><left style=\"thin\"><color rgb=\"FF808080\"/></left><right style=\"thin\"><color rgb=\"FF808080\"/></right><top style=\"thin\"><color rgb=\"FF808080\"/></top><bottom style=\"thin\"><color rgb=\"FF808080\"/></bottom><diagonal/></border></borders>");
            sb.Append("<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>");
            sb.Append("<cellXfs count=\"" + xfs.Length + "\">");
            foreach (var x in xfs) sb.Append(x);
            sb.Append("</cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>");
            return sb.ToString();
        }

        static string X(int font, int fill, int border, int fmt, string h)
        {
            string a = "<xf numFmtId=\"" + fmt + "\" fontId=\"" + font + "\" fillId=\"" + fill + "\" borderId=\"" + border + "\" xfId=\"0\"";
            if (font != 0) a += " applyFont=\"1\"";
            if (fill != 0) a += " applyFill=\"1\"";
            if (border != 0) a += " applyBorder=\"1\"";
            if (fmt != 0) a += " applyNumberFormat=\"1\"";
            a += " applyAlignment=\"1\"><alignment vertical=\"center\" wrapText=\"1\"" + (h != null ? " horizontal=\"" + h + "\"" : "") + "/></xf>";
            return a;
        }

        // ---------- OKUMA ----------
        public class SheetData
        {
            public string Name;
            public List<List<string>> Rows = new List<List<string>>();
        }

        static XElement LoadEntry(ZipArchive z, string name)
        {
            name = name.TrimStart('/');
            var e = z.Entries.FirstOrDefault(x => string.Equals(x.FullName, name, StringComparison.OrdinalIgnoreCase));
            if (e == null) return null;
            using (var s = e.Open()) return XDocument.Load(s).Root;
        }

        static string AllText(XElement e)
        {
            XNamespace ns = NS;
            var sb = new StringBuilder();
            foreach (var t in e.Descendants(ns + "t"))
            {
                // fonetik (rPh) metinlerini atla
                if (t.Parent != null && t.Parent.Name == ns + "rPh") continue;
                sb.Append(t.Value);
            }
            return sb.ToString();
        }

        static int ColIndex(string r)
        {
            int c = 0;
            foreach (char ch in r)
            {
                if (ch >= 'A' && ch <= 'Z') c = c * 26 + (ch - 'A' + 1);
                else if (ch >= 'a' && ch <= 'z') c = c * 26 + (ch - 'a' + 1);
                else break;
            }
            return c - 1;
        }

        public static List<SheetData> Read(string path)
        {
            XNamespace ns = NS;
            XNamespace rns = RNS;
            var result = new List<SheetData>();
            using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (var z = new ZipArchive(fs, ZipArchiveMode.Read))
            {
                var wb = LoadEntry(z, "xl/workbook.xml");
                if (wb == null) throw new InvalidDataException("Geçerli bir .xlsx dosyası değil.");
                var relRoot = LoadEntry(z, "xl/_rels/workbook.xml.rels");
                var rels = new Dictionary<string, string>();
                if (relRoot != null)
                    foreach (var r in relRoot.Elements())
                    {
                        string t = (string)r.Attribute("Target") ?? "";
                        if (t.StartsWith("/")) t = t.TrimStart('/');
                        else t = "xl/" + t;
                        rels[(string)r.Attribute("Id")] = t;
                    }
                var shared = new List<string>();
                var ss = LoadEntry(z, "xl/sharedStrings.xml");
                if (ss != null) foreach (var si in ss.Elements(ns + "si")) shared.Add(AllText(si));

                var sheetsEl = wb.Element(ns + "sheets");
                if (sheetsEl == null) return result;
                foreach (var sh in sheetsEl.Elements(ns + "sheet"))
                {
                    var sd = new SheetData { Name = (string)sh.Attribute("name") };
                    string rid = (string)sh.Attribute(rns + "id");
                    string target;
                    if (rid == null || !rels.TryGetValue(rid, out target)) continue;
                    var root = LoadEntry(z, target);
                    if (root == null) continue;
                    var data = root.Element(ns + "sheetData");
                    if (data != null)
                    {
                        int autoRow = 0;
                        foreach (var row in data.Elements(ns + "row"))
                        {
                            int rIdx;
                            var ra = row.Attribute("r");
                            rIdx = ra != null ? int.Parse(ra.Value, CultureInfo.InvariantCulture) - 1 : autoRow;
                            autoRow = rIdx + 1;
                            while (sd.Rows.Count <= rIdx) sd.Rows.Add(new List<string>());
                            var list = sd.Rows[rIdx];
                            int autoCol = 0;
                            foreach (var c in row.Elements(ns + "c"))
                            {
                                var refA = c.Attribute("r");
                                int cIdx = refA != null ? ColIndex(refA.Value) : autoCol;
                                autoCol = cIdx + 1;
                                string t = (string)c.Attribute("t");
                                string val;
                                var vEl = c.Element(ns + "v");
                                if (t == "s")
                                {
                                    int si;
                                    val = (vEl != null && int.TryParse(vEl.Value, out si) && si < shared.Count) ? shared[si] : "";
                                }
                                else if (t == "inlineStr")
                                {
                                    var isEl = c.Element(ns + "is");
                                    val = isEl != null ? AllText(isEl) : "";
                                }
                                else val = vEl != null ? vEl.Value : "";
                                while (list.Count <= cIdx) list.Add("");
                                list[cIdx] = val ?? "";
                            }
                        }
                    }
                    result.Add(sd);
                }
            }
            return result;
        }
    }
}
