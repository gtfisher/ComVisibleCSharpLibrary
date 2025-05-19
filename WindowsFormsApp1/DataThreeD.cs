using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WindowsFormsApp1
{
    public class DataThreeD
    {
        public DataThreeD() { }
        public static DataThreeD fromStr (string jstr) {
            return JsonConvert.DeserializeObject<DataThreeD>(jstr);

        }
        public string Version { get; set; }
        public OBJATTRIB objattrib { get; set; }
        public string srcPath { get; set; }
        public string berthName { get; set; }
        public int berthType { get; set; }
        public int SceneToTrueNorth { get; set; }
        public int BerthTargetRO { get; set; }
        public Shoretarget shoretarget { get; set; }
        public int berthSolid { get; set; }
        public double pierHeight { get; set; }
        public int pierWidth { get; set; }
        public bool piervisible { get; set; }
        public double walkwayDepth { get; set; }
        public int pillarradius { get; set; }
        public int vesselAngleToBerth { get; set; }
        public List<int> vecWind { get; set; }
        public List<int> vecCurrent { get; set; }
        public List<int> vecWaves { get; set; }
        public List<int> vecSwell { get; set; }
        public List<int> vecSurge { get; set; }
        public int channelWidth { get; set; }
        public int channelStart { get; set; }
        public List<List<double>> piermarkers { get; set; }
        public int depthWater { get; set; }
        public double heightWater { get; set; }
        public int beachWidth { get; set; }
        public double heightLand { get; set; }
        public List<List<object>> bollards { get; set; }
        public List<object> servicebollards { get; set; }
        public List<int> CALMpos { get; set; }
        public object catdata { get; set; }
        public int simtime { get; set; }
        public double fenderFaceDepth { get; set; }
        public int fenderStemWidth { get; set; }
        public List<List<object>> fenders { get; set; }
        public double maxFenderZ { get; set; }
        public Vessel HOST { get; set; }
        public object GUEST { get; set; }
        public int PASSINGlpp { get; set; }
        public PASSINGpos PASSINGpos { get; set; }

        public class OBJATTRIB
        {
            public double FL_HEIGHT { get; set; }
            public double FL_DEPTH { get; set; }
        }

        public class Shoretarget
        {
            public int x { get; set; }
            public double y { get; set; }
            public double z { get; set; }
        }

        public class Vessel
        {
            public string Version { get; set; }
            public string vesselname { get; set; }
            public int FwdWindArea { get; set; }
            public int SideWindArea { get; set; }
            public double Displacement { get; set; }
            public int vesselSphPrism { get; set; }
            public int HasCabin { get; set; }
            public int VesselType { get; set; }
            public int VesselFacing { get; set; }
            public int LBP { get; set; }
            public double LOA { get; set; }
            public double shipBreadthDefault { get; set; }
            public double shipBreadth { get; set; }
            public int shipDepth { get; set; }
            public int flatsideFitsHull { get; set; }
            public int deckHeight { get; set; }
            public Excursion excursion { get; set; }
            public Offset offset { get; set; }
            public double shipDraft { get; set; }
            public int heave { get; set; }
            public double clearance { get; set; }
            public int trim { get; set; }
            public List<double> portTarget { get; set; }
            public List<double> stbdTarget { get; set; }
            public double FenderLimitAft { get; set; }
            public double FenderLimitFwd { get; set; }
            public int STSFenderGap { get; set; }
            public List<List<double>> flatside { get; set; }
            public DeckControlPoints sp { get; set; }
            public Brand brand { get; set; }
            public Catdata catdata { get; set; }
            public List<List<double>> vesselLines { get; set; }
            public Segments segments { get; set; }
            public DollyData dollyData { get; set; }
            public List<List<double>> winchPosition { get; set; }
            public List<List<object>> winchData { get; set; }
            public int fenderFaceDepth { get; set; }
            public int fenderStemWidth { get; set; }
            public object fenderOther { get; set; }
            public List<object> fenders { get; set; }
            public List<List<object>> pierLines { get; set; }
            public List<object> vecForce { get; set; }
            public List<int> otherForce { get; set; }
            public object hullpoints { get; set; }
            public List<Decky> decky { get; set; }
        }

        public class Excursion
        {
            public int x { get; set; }
            public int y { get; set; }
            public int z { get; set; }
        }
    }

    public class Decky
    {
        public double x { get; set; }
        public double y { get; set; }
        public double z { get; set; }
    }

    public class PASSINGpos
    {
        public int Item1 { get; set; }
        public int Item2 { get; set; }
    }

    public class Offset
    {
        public double x { get; set; }
        public double y { get; set; }
        public int z { get; set; }
    }

}
