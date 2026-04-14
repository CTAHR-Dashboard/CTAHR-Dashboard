#*****************************************************************
#
#  PROJECT: Hawaii Fisheries Dashboard
#
#  CLASS: CTAHR Data Pipeline
#
#  FILE: collapse_fisheries_geoJSON.py
#
#  DESCRIPTION: Takes a gpkg file and compresses it without data loss by aggregating by the "geometry" column.
#
#  HOW TO USE:
#
#    python collapse_fisheries_geoJSON.py <Arg1> <Arg2>
#    - Arg1: path to gpkg (or geoJSON) file
#    - Arg2: path to output file (will be created)
#
#    e.g. python collapse_fisheries_geoJSON.py ./noncomm_ev.gpkg ./noncomm_collapsed.geojson
#
#*****************************************************************

import geopandas as gpd
import pandas as pd
import sys

### end importing libraries

arg1 = ""
arg2 = ""
usage = """
python collapse_geoJSON.py <Arg1> <Arg2>
- Arg1: path to gpkg file
- Arg2: path to output file (will be created)
e.g. python collapse_fisheries_geoJSON.py ./noncomm_ev.gpkg ./noncomm_collapsed.geojson
"""

if (len(sys.argv) != 3):
    print("Incorrect number of arguments! usage is as follows: ")
    print(usage)
    sys.exit()
else:
    arg1 = sys.argv[1]
    arg2 = sys.argv[2]

### end setting arguments

def is_valid_df(x):
    must_have = {"geometry", "year", "area_id", "county_olelo", "species_group", "ecosystem_type", "exchange_value"}
    current_columns = set(x.columns)

    if (must_have.issubset(current_columns)):
        print("✅ All columns are valid!")
    else:
        print("❌ The following columns are missing: " + str(must_have - current_columns))
        print("We require the following columns: " + str(must_have))
        return False;

    are_rows_valid = True;
    for row in x.index:
        if ((len(x.loc[row, "year"]) == len(x.loc[row, "species_group"])) and (len(x.loc[row, "species_group"]) == len(x.loc[row, "ecosystem_type"])) and (len(x.loc[row, "ecosystem_type"]) == len(x.loc[row, "exchange_value"]))):
            pass
        else:
            print("❌ Row " + str(row) + " is invalid!")
            cols_to_compare = ["year", "species_group", "ecosystem_type", "exchange_value"]
            for col in cols_to_compare:
                print("Length of '" + col + "' is: " + str(len(x.loc[row, col])))
            print("Array lengths mismatch.")
            print("=====")
            are_rows_valid = False;

    if (are_rows_valid):
        print("✅ All rows are valid!")
    else:
        print("❌ Some columns are invalid. See above.")

    return are_rows_valid;

### end helper function

### start script

print("Reading " + arg1 + "...")
geojson_df = gpd.read_file(arg1)
print("Finished reading " + arg1)
print("Checking now...")

crs = geojson_df.crs or "EPSG:4326"
def groupIntoArray(group_data):
    if (len(set(group_data)) == 1):
        return list(group_data)[0]
    
    return list(group_data)

geojson_df.drop(["county", "exchange_value_formatted"], inplace=True, axis=1)
geojson_df["area_id"] = geojson_df["area_id"].apply(lambda x: "moku_ID_" + str(x))
geojson_df["exchange_value"] = geojson_df["exchange_value"].fillna(-1.0)
x = geojson_df.groupby(["geometry"], as_index=False).agg(groupIntoArray)

is_valid = is_valid_df(x)

if (is_valid):
    new_gdf = gpd.GeoDataFrame(x, geometry="geometry", crs=crs)
    #new_gdf.to_file("collapsed_comm_ev.geojson", driver="geoJSON")
    new_gdf.to_file(arg2, driver="geoJSON")
    print("✅✅✅ Outputted compressed GeoJSON to: " + arg2)
else:
    print("❌ There were some issues with formatting. Could not compress GeoJSON.")

